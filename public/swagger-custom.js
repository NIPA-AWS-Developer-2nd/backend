// Swagger UI 자동 인증 스크립트
(function () {
  'use strict';

  // Swagger UI가 로드된 후 실행
  function waitForSwagger() {
    if (typeof window.ui === 'undefined') {
      setTimeout(waitForSwagger, 100);
      return;
    }

    // 기존 fetch를 오버라이드하여 dev-token API 응답을 가로챔
    const originalFetch = window.fetch;

    window.fetch = function (...args) {
      const [url, options] = args;

      // dev-token API 호출인지 확인
      if (
        url &&
        url.includes('/auth/dev-token') &&
        options &&
        options.method === 'POST'
      ) {
        return originalFetch.apply(this, args).then((response) => {
          // 응답이 성공적이면 토큰을 추출하여 자동 인증
          if (response.ok) {
            response
              .clone()
              .json()
              .then((data) => {
                if (data && data.data && data.data.accessToken) {
                  const token = data.data.accessToken;

                  // Swagger UI의 authorize 함수 호출
                  if (window.ui && window.ui.authActions) {
                    window.ui.authActions.authorize({
                      bearerAuth: {
                        name: 'bearerAuth',
                        schema: {
                          type: 'http',
                          scheme: 'bearer',
                          bearerFormat: 'JWT',
                        },
                        value: token,
                      },
                    });

                    // 사용자에게 알림
                    console.log('🚀 개발 토큰으로 자동 인증되었습니다!');

                    // 페이지 상단에 성공 메시지 표시
                    showAutoAuthMessage();
                  }
                }
              });
          }

          return response;
        });
      }

      return originalFetch.apply(this, args);
    };
  }

  // 자동 인증 성공 메시지 표시
  function showAutoAuthMessage() {
    // 기존 메시지가 있으면 제거
    const existingMsg = document.querySelector('.auto-auth-message');
    if (existingMsg) {
      existingMsg.remove();
    }

    // 새로운 메시지 엘리먼트 생성
    const messageEl = document.createElement('div');
    messageEl.className = 'auto-auth-message';
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
    `;
    messageEl.innerHTML =
      '🚀 Automatically authenticated with development token';

    // 애니메이션 CSS 추가
    if (!document.querySelector('#auto-auth-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'auto-auth-styles';
      styleEl.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(styleEl);
    }

    document.body.appendChild(messageEl);

    // 3초 후 메시지 제거
    setTimeout(() => {
      messageEl.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => {
        if (messageEl.parentNode) {
          messageEl.parentNode.removeChild(messageEl);
        }
      }, 300);
    }, 3000);
  }

  // DOM이 로드된 후 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForSwagger);
  } else {
    waitForSwagger();
  }
})();

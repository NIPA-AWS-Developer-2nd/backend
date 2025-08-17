import { Injectable, Logger } from '@nestjs/common';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { ConfigService } from '@nestjs/config';

export interface BedrockVerificationResult {
  isValid: boolean;
  confidence: number;
  reasoning: string;
  detectedElements: string[];
}

interface BedrockResponseContent {
  text?: string;
}

interface BedrockResponse {
  content: BedrockResponseContent[];
}

interface ClaudeVerificationResponse {
  isValid: boolean;
  confidence: number;
  reasoning: string;
  detectedElements: string[];
}

@Injectable()
export class BedrockService {
  private readonly logger = new Logger(BedrockService.name);
  private readonly bedrockClient: BedrockRuntimeClient;

  constructor(private readonly configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
    const region =
      this.configService.get<string>('AWS_BEDROCK_REGION') || 'us-east-1';

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials are required for Bedrock service');
    }

    this.bedrockClient = new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async verifyMissionPhoto(
    photoBase64: string,
    missionTitle: string,
    missionDescription: string,
    verificationGuide: string,
  ): Promise<BedrockVerificationResult> {
    try {
      const prompt = this.buildVerificationPrompt(
        missionTitle,
        missionDescription,
        verificationGuide,
      );

      const command = new InvokeModelCommand({
        modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        contentType: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt,
                },
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: photoBase64,
                  },
                },
              ],
            },
          ],
        }),
      });

      const response = await this.bedrockClient.send(command);
      const responseBody = JSON.parse(
        new TextDecoder().decode(response.body),
      ) as BedrockResponse;

      this.logger.debug('Bedrock response:', responseBody);

      // Claude의 응답을 파싱하여 결과 반환
      return this.parseClaudeResponse(
        responseBody.content[0]?.text || '',
        missionTitle,
      );
    } catch (error) {
      this.logger.error('Bedrock verification failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`사진 인증 처리 중 오류가 발생했습니다: ${errorMessage}`);
    }
  }

  private buildVerificationPrompt(
    missionTitle: string,
    missionDescription: string,
    verificationGuide: string,
  ): string {
    return `
당신은 미션 사진 인증 검증 전문가입니다. 제공된 사진이 미션 요구사항을 충족하는지 엄격하게 검증해주세요.

미션 정보:
- 제목: ${missionTitle}
- 설명: ${missionDescription}
- 인증 가이드: ${verificationGuide}

응답 형식을 반드시 다음과 같이 JSON 형태로 작성해주세요:
{
  "isValid": true/false,
  "confidence": 0-100 (숫자),
  "reasoning": "판단 근거를 한국어로 상세히 설명",
  "detectedElements": ["감지된 요소들을 배열로 나열"]
}

인증 가이드를 참고해 엄격한 기준으로 판단하되, 명확한 근거가 있을 때만 승인해주세요.
`;
  }

  private parseClaudeResponse(
    responseText: string,
    _missionTitle: string,
  ): BedrockVerificationResult {
    try {
      // JSON 부분만 추출
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON 응답을 찾을 수 없습니다');
      }

      const parsed = JSON.parse(jsonMatch[0]) as ClaudeVerificationResponse;

      return {
        isValid: Boolean(parsed.isValid),
        confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 0)),
        reasoning: String(parsed.reasoning || '응답을 파싱할 수 없습니다'),
        detectedElements: Array.isArray(parsed.detectedElements)
          ? parsed.detectedElements.map(String)
          : [],
      };
    } catch (error) {
      this.logger.error('Failed to parse Claude response:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      // 파싱 실패 시 보수적으로 거부
      return {
        isValid: false,
        confidence: 0,
        reasoning: `응답 파싱 실패: ${errorMessage}`,
        detectedElements: [],
      };
    }
  }
}

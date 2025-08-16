import { Injectable, Logger } from '@nestjs/common';

export interface ReverseGeocodeResponse {
  address: string;
  region: {
    area1: string; // 시/도
    area2: string; // 시/군/구
    area3: string; // 읍/면/동
  };
  roadAddress?: string;
  jibunAddress?: string;
}

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);

  async reverseGeocode(
    lat: number,
    lng: number,
  ): Promise<ReverseGeocodeResponse> {
    this.logger.log(`Reverse geocoding for coordinates: ${lat}, ${lng}`);

    try {
      const response = await fetch(
        `https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=${lng},${lat}&output=json&orders=roadaddr,addr`,
        {
          method: 'GET',
          headers: {
            'x-ncp-apigw-api-key-id': process.env.NAVER_MAP_CLIENT_ID || '',
            'x-ncp-apigw-api-key': process.env.NAVER_MAP_CLIENT_SECRET || '',
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Reverse geocoding API request failed: ${response.status}`,
        );
      }

      const data = await response.json();

      if (data.status.code === 0 && data.results && data.results.length > 0) {
        let address = '';
        let roadAddress = '';
        let jibunAddress = '';
        let region = { area1: '', area2: '', area3: '' };

        // 도로명주소 우선
        const roadResult = data.results.find((r: any) => r.name === 'roadaddr');
        if (roadResult) {
          const reg = roadResult.region;
          region = {
            area1: reg.area1?.name || '',
            area2: reg.area2?.name || '',
            area3: reg.area3?.name || '',
          };

          if (roadResult.land?.name && roadResult.land?.number1) {
            roadAddress = `${region.area1} ${region.area2} ${roadResult.land.name} ${roadResult.land.number1}`;
            address = roadAddress;
          }
        }

        // 지번주소
        const addrResult = data.results.find((r: any) => r.name === 'addr');
        if (addrResult) {
          const reg = addrResult.region;
          region = {
            area1: reg.area1?.name || region.area1,
            area2: reg.area2?.name || region.area2,
            area3: reg.area3?.name || region.area3,
          };

          if (addrResult.land?.number1) {
            jibunAddress = `${region.area1} ${region.area2} ${region.area3} ${addrResult.land.number1}${addrResult.land.number2 ? `-${addrResult.land.number2}` : ''}`;
            if (!address) {
              address = jibunAddress;
            }
          }
        }

        // 기본 주소가 없으면 최소한 구/동 정보라도
        if (!address) {
          address = `${region.area1} ${region.area2} ${region.area3}`.trim();
        }

        return {
          address,
          region,
          roadAddress: roadAddress || undefined,
          jibunAddress: jibunAddress || undefined,
        };
      } else {
        // API에서 결과가 없으면 간단한 매핑 사용
        return this.getSimpleLocationMapping(lat, lng);
      }
    } catch (error) {
      this.logger.error('Reverse geocoding failed:', error);
      // 에러 발생 시 간단한 매핑 사용
      return this.getSimpleLocationMapping(lat, lng);
    }
  }

  private getSimpleLocationMapping(
    lat: number,
    lng: number,
  ): ReverseGeocodeResponse {
    // 서울 지역 세분화된 매핑
    if (lat >= 37.4 && lat <= 37.7 && lng >= 126.8 && lng <= 127.2) {
      if (lat >= 37.49 && lat <= 37.54 && lng >= 127.02 && lng <= 127.08) {
        return {
          address: '서울시 강남구',
          region: { area1: '서울특별시', area2: '강남구', area3: '' },
        };
      } else if (
        lat >= 37.47 &&
        lat <= 37.51 &&
        lng >= 127.0 &&
        lng <= 127.05
      ) {
        return {
          address: '서울시 서초구',
          region: { area1: '서울특별시', area2: '서초구', area3: '' },
        };
      } else if (
        lat >= 37.47 &&
        lat <= 37.53 &&
        lng >= 127.08 &&
        lng <= 127.15
      ) {
        return {
          address: '서울시 송파구',
          region: { area1: '서울특별시', area2: '송파구', area3: '' },
        };
      } else if (
        lat >= 37.52 &&
        lat <= 37.57 &&
        lng >= 127.11 &&
        lng <= 127.16
      ) {
        return {
          address: '서울시 강동구',
          region: { area1: '서울특별시', area2: '강동구', area3: '' },
        };
      } else if (
        lat >= 37.55 &&
        lat <= 37.58 &&
        lng >= 126.97 &&
        lng <= 127.01
      ) {
        return {
          address: '서울시 중구',
          region: { area1: '서울특별시', area2: '중구', area3: '' },
        };
      } else if (
        lat >= 37.56 &&
        lat <= 37.61 &&
        lng >= 126.96 &&
        lng <= 127.01
      ) {
        return {
          address: '서울시 종로구',
          region: { area1: '서울특별시', area2: '종로구', area3: '' },
        };
      } else if (
        lat >= 37.54 &&
        lat <= 37.58 &&
        lng >= 126.82 &&
        lng <= 126.88
      ) {
        return {
          address: '서울시 강서구',
          region: { area1: '서울특별시', area2: '강서구', area3: '' },
        };
      } else if (
        lat >= 37.54 &&
        lat <= 37.58 &&
        lng >= 126.9 &&
        lng <= 126.96
      ) {
        return {
          address: '서울시 마포구',
          region: { area1: '서울특별시', area2: '마포구', area3: '' },
        };
      } else if (
        lat >= 37.51 &&
        lat <= 37.55 &&
        lng >= 126.89 &&
        lng <= 126.95
      ) {
        return {
          address: '서울시 영등포구',
          region: { area1: '서울특별시', area2: '영등포구', area3: '' },
        };
      } else {
        return {
          address: '서울시',
          region: { area1: '서울특별시', area2: '', area3: '' },
        };
      }
    }
    // 경기도 지역
    else if (lat >= 37.2 && lat <= 37.8 && lng >= 126.7 && lng <= 127.3) {
      return {
        address: '경기도',
        region: { area1: '경기도', area2: '', area3: '' },
      };
    }
    // 인천
    else if (lat >= 37.3 && lat <= 37.6 && lng >= 126.4 && lng <= 126.8) {
      return {
        address: '인천광역시',
        region: { area1: '인천광역시', area2: '', area3: '' },
      };
    }
    // 기타 지역은 좌표 표시
    else {
      return {
        address: `위도 ${lat.toFixed(4)}, 경도 ${lng.toFixed(4)}`,
        region: { area1: '', area2: '', area3: '' },
      };
    }
  }
}

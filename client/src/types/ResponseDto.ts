interface CommonResType<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

export const commonResDto = <T>(
  success: boolean,
  code: number,
  message: string,
  data: T
): CommonResType<T> => {
  return { success, code, message, data };
};

/**
 * API 공용 응답 DTO
 * @param <T> 응답 data 페이로드의 타입
 */
export class ResponseDto<T> {
  public readonly code: number = 200;
  public readonly message: string;
  public readonly data: T;

  /**
   * DTO 생성을 위한 private 생성자.
   * 정적 팩토리 메소드(success, fail)를 통해서만 인스턴스를 생성해야 한다.
   */
  public constructor(code: number, message: string, data: T) {
    this.code = code;
    this.message = message;
    this.data = data;
  }

  /**
   * [정적 팩토리 메소드]
   * 성공 응답
   * @param code  응답 코드
   * @param data 응답에 포함될 데이터
   * @param message [Optional] 커스텀 성공 메시지
   * @returns ResponseDto<T>
   */
  public static success<T>(
    code: number,
    message: string = "Success",
    data: T | null = null
  ): ResponseDto<T | null> {
    return new ResponseDto(code, message, data);
  }

  /**
   * [정적 팩토리 메소드]
   * 실패 응답
   * @param message 에러 메시지
   * @param data 응답에 포함될 데이터
   * @returns ResponseDto<T | null>
   */
  public static fail<T = null>(code: number, message: string, data: T): ResponseDto<T | null> {
    return new ResponseDto(code, message, data);
  }
}

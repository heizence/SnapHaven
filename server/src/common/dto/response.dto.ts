import { ApiProperty } from '@nestjs/swagger';

/**
 * API 공용 응답 DTO
 * @param <T> 응답 data 페이로드의 타입
 */
export class ResponseDto<T> {
  @ApiProperty({
    example: 200,
    description: 'HTTP 상태 코드 (HttpStatus 열거형 값)',
  })
  public readonly code: number = 200;

  @ApiProperty({ example: 'Success', description: '응답 메시지' })
  public readonly message: string;

  @ApiProperty({
    description: '응답 데이터 페이로드 (제네릭 타입)',
    nullable: true, // 실패 시 또는 데이터가 없는 성공 시 null
  })
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
    message: string = 'Success',
    data: T,
  ): ResponseDto<T> {
    return new ResponseDto(code, message, data);
  }

  /**
   * [정적 팩토리 메소드]
   * 성공 응답 (데이터 미포함)
   * @param message [Optional] 커스텀 성공 메시지
   * @returns ResponseDto<null>
   */
  public static successWithoutData(
    code: number,
    message: string = 'Success',
  ): ResponseDto<null> {
    return new ResponseDto(code, message, null);
  }

  /**
   * [정적 팩토리 메소드]
   * 실패 응답
   * @param message 에러 메시지
   * @param data 응답에 포함될 데이터
   * @returns ResponseDto<T | null>
   */
  public static fail<T = null>(
    code: number,
    message: string,
    data: T,
  ): ResponseDto<T | null> {
    return new ResponseDto(code, message, data);
  }
}

// 유저 가입 방식
export enum AuthProvider {
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
}

// 미디어 콘텐츠 유형
export enum ContentType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

// 미디어 콘텐츠 업로드 상태
export enum ContentStatus {
  PENDING = 'PENDING', // 업로드 대기 중
  PROCESSING = 'PROCESSING', // 업로드 진행 중
  ACTIVE = 'ACTIVE', // 업로드 완료(활성화)
  FAILED = 'FAILED', // 업로드 실패
  DELETED = 'DELETED', // Soft Delete 처리되었을 때
}

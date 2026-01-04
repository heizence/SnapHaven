"use client";

export default function TermsPage() {
  const handleOnClick = () => {
    window.history.back();
  };
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 text-slate-800">
      <h1 className="mb-8 text-3xl font-bold">이용약관</h1>

      <section className="space-y-6 text-sm leading-relaxed text-slate-600">
        <div>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">제 1 조 (목적)</h2>
          <p>
            본 약관은 SnapHaven(이하 "서비스")이 제공하는 모든 서비스의 이용 조건 및 절차, 이용자와
            서비스 운영자의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">제 2 조 (용어의 정의)</h2>
          <p>
            1. "이용자"란 서비스를 이용하는 모든 고객을 의미합니다.
            <br />
            2. "회원"이란 본 약관에 동의하고 계정을 생성한 이용자를 의미합니다.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">
            제 3 조 (약관의 효력 및 변경)
          </h2>
          <p>
            서비스는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 화면에 게시합니다. 약관이
            변경될 경우 최소 7일 전에 공지합니다.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">제 4 조 (이용자의 의무)</h2>
          <p>
            이용자는 다음 행위를 하여서는 안 됩니다.
            <br />
            - 신청 또는 변경 시 허위 내용의 등록
            <br />
            - 타인의 정보 도용
            <br />- 서비스의 안정적 운영을 방해하는 행위
          </p>
        </div>
      </section>

      <div className="mt-12 border-t pt-6 text-center">
        <button onClick={handleOnClick} className="text-blue-500 hover:underline">
          뒤로 가기
        </button>
      </div>
    </div>
  );
}

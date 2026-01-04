"use client";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 text-slate-800">
      <h1 className="mb-8 text-3xl font-bold">개인정보 처리방침</h1>

      <section className="space-y-6 text-sm leading-relaxed text-slate-600">
        <div className="rounded-lg bg-blue-50 p-4 text-blue-800">
          <p className="font-medium">
            SnapHaven은 이용자의 개인정보를 최소한으로 수집하며, 안전하게 관리합니다.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">1. 개인정보 수집 항목</h2>
          <p>서비스는 회원가입 및 서비스 제공을 위해 아래의 정보를 수집합니다.</p>
          <ul className="list-inside list-disc mt-2">
            <li>필수 항목: 이메일 주소</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">2. 개인정보 수집 목적</h2>
          <p>
            수집된 이메일은 회원 식별, 서비스 공지사항 전달, 비밀번호 재설정 등 계정 관리 목적으로만
            사용됩니다.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">
            3. 개인정보의 보유 및 이용기간
          </h2>
          <p className="font-semibold text-slate-900 underline">
            회원 탈퇴 시 수집된 개인정보는 즉시 파기 처리됩니다. 단, 부정 이용 방지를 위해 탈퇴
            일시로부터 30일간 보관 후 복구가 불가능한 방법으로 영구 삭제됩니다.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">4. 이용자의 권리</h2>
          <p>
            이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며, 회원 탈퇴를 통해
            개인정보 이용 동의를 철회할 수 있습니다.
          </p>
        </div>
      </section>

      <div className="mt-12 border-t pt-6 text-center">
        <button
          onClick={() => {
            window.history.back();
          }}
          className="text-blue-500 hover:underline"
        >
          뒤로 가기
        </button>
      </div>
    </div>
  );
}

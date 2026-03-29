export default function ErrorFallback({ error }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50 px-4">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">오류가 발생했습니다</h1>
      <code className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 max-w-lg w-full text-center break-all mb-6">
        {error?.message || '알 수 없는 오류'}
      </code>
      <button
        onClick={() => window.location.reload()}
        className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
      >
        새로고침
      </button>
    </div>
  )
}

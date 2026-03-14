import React from 'react'

const SCORE_LABELS = {
  conversion: { label: 'Conversion', color: 'bg-emerald-500' },
  margin: { label: 'Margin', color: 'bg-blue-500' },
  experience: { label: 'Experience', color: 'bg-amber-500' },
  brand_visibility: { label: 'Brand', color: 'bg-purple-500' },
}

function ScoreBar({ label, value, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-gray-500 w-20 text-right truncate">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className="text-[11px] font-semibold text-gray-700 w-8">{value}</span>
    </div>
  )
}

function OverallScoreRing({ score }) {
  const circumference = 2 * Math.PI * 36
  const offset = circumference - (score / 100) * circumference
  const scoreColor =
    score >= 75 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-red-500'
  const strokeColor =
    score >= 75 ? 'stroke-emerald-500' : score >= 50 ? 'stroke-amber-500' : 'stroke-red-500'

  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke="#f3f4f6"
          strokeWidth="6"
        />
        <circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          className={strokeColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xl font-bold ${scoreColor}`}>{score}</span>
      </div>
    </div>
  )
}

export default function VariantsModal({ variants, onSelect, onClose }) {
  const hasVariants = variants && variants.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl mx-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Select Layout Variant</h2>
          <p className="mt-1 text-sm text-gray-500">
            Compare the generated variants and choose the best fit for your store
          </p>
        </div>

        <div className="p-6">
          {!hasVariants ? (
            <div className="flex flex-col items-center justify-center py-16">
              <svg
                className="h-12 w-12 text-gray-300 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z"
                />
              </svg>
              <p className="text-sm text-gray-500">No layout variants available.</p>
              <p className="mt-1 text-xs text-gray-400">
                Try generating a planogram first.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {variants.slice(0, 3).map((variant, index) => {
                const scores = variant.scores || {}
                const overall = scores.overall ?? 0
                const isRecommended = index === 0

                return (
                  <div
                    key={index}
                    className={[
                      'relative rounded-xl border-2 p-5 transition-all hover:shadow-lg',
                      isRecommended
                        ? 'border-blue-300 bg-blue-50/30 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300',
                    ].join(' ')}
                  >
                    {/* Recommended badge */}
                    {isRecommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Recommended
                        </span>
                      </div>
                    )}

                    {/* Variant name */}
                    <h3 className="text-sm font-semibold text-gray-900 text-center mt-1 mb-4">
                      {variant.name || variant.label || `Variant ${index + 1}`}
                    </h3>

                    {/* Overall score ring */}
                    <OverallScoreRing score={overall} />
                    <p className="text-center text-xs text-gray-500 mt-1 mb-4">Overall Score</p>

                    {/* Sub-scores */}
                    <div className="space-y-2 mb-4">
                      {Object.entries(SCORE_LABELS).map(([key, meta]) => (
                        <ScoreBar
                          key={key}
                          label={meta.label}
                          value={scores[key] ?? 0}
                          color={meta.color}
                        />
                      ))}
                    </div>

                    {/* Key differences */}
                    {variant.key_differences && (
                      <div className="mb-4 rounded-lg bg-gray-50 p-3">
                        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Key Differences
                        </p>
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {variant.key_differences}
                        </p>
                      </div>
                    )}

                    {/* Select button */}
                    <button
                      onClick={() => onSelect(index)}
                      className={[
                        'w-full rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                        isRecommended
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
                      ].join(' ')}
                    >
                      Select {variant.name || variant.label || `Variant ${index + 1}`}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SectionHeading({ id, title, description, action, align = 'left', className = '' }) {
  const centered = align === 'center'

  return (
    <div
      className={`flex flex-col gap-6 ${
        centered ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between'
      } ${className}`}
    >
      <div className={`max-w-2xl ${centered ? 'mx-auto' : ''}`}>
        <h2
          id={id}
          className="text-[2rem] font-extrabold leading-[1.02] tracking-[-0.03em] sm:text-4xl lg:text-[2.9rem]"
        >
          {title}
        </h2>
        {description && (
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft sm:text-base">
            {description}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function ResidentInfoRow({
  label,
  value,
}: {
  label: string
  value: string | number | undefined | null
}) {
  return (
    <p className="text-base">
      {label}:
      <span className="text-base font-semibold ml-4">{value ?? 'N/A'}</span>
    </p>
  )
}

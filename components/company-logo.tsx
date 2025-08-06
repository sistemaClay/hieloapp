"use client"

export function CompanyLogo({ className = "h-16 w-auto" }: { className?: string }) {
  return (
    <div className="flex items-center gap-4">
      <img
        src="/logo-la-clay.png"
        alt="Ladrillera La Clay S.A.S"
        className={className}
        crossOrigin="anonymous"
      />
      <div className="text-left">
        <h1 className="text-2xl font-bold text-gray-900">Control de Inventario</h1>
        <p className="text-lg text-gray-600">LADRILLERA LA CLAY S.A.S</p>
      </div>
    </div>
  )
}

function StatCard({ label, value, meta, icon: Icon, accent = 'bg-blue-50 text-secondary', valueClass = 'text-primary', metaClass = 'text-muted' }) {
  return (
    <div className="card p-5 relative overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-muted font-medium">{label}</div>
          <div className={`text-3xl font-bold font-heading mt-2 leading-none ${valueClass}`}>{value}</div>
          {meta && <div className={`text-sm mt-2 font-medium ${metaClass}`}>{meta}</div>}
        </div>
        {Icon && (
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;

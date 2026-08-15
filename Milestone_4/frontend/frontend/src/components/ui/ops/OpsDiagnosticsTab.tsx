'use client';
import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Database, Cloud, Cpu, HardDrive, Zap, Server, ActivitySquare } from 'lucide-react';

interface OpsDiagnosticsTabProps {
  token: string;
}

type ServiceStatus = 'ok' | 'warning' | 'error' | 'unknown';

const StatusLight = ({ status }: { status: ServiceStatus }) => {
  const colors: Record<ServiceStatus, string> = {
    ok: 'bg-emerald-500 shadow-emerald-400/50',
    warning: 'bg-amber-400 shadow-amber-400/50',
    error: 'bg-red-500 shadow-red-400/50',
    unknown: 'bg-slate-400 shadow-slate-300/50',
  };
  return (
    <div className={`w-3 h-3 rounded-full shadow-lg animate-pulse ${colors[status]}`} />
  );
};

const StatusBadge = ({ status }: { status: ServiceStatus }) => {
  const styles: Record<ServiceStatus, string> = {
    ok: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-600',
    unknown: 'bg-slate-100 text-slate-500',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${styles[status]}`}>
      {status === 'ok' ? 'Operational' : status === 'warning' ? 'Warning' : status === 'error' ? 'Error' : 'Unknown'}
    </span>
  );
};

const ServiceCard = ({
  icon: Icon,
  name,
  status,
  details,
}: {
  icon: any;
  name: string;
  status: ServiceStatus;
  details: React.ReactNode;
}) => (
  <div className={`bg-white border rounded-2xl p-5 shadow-sm transition-all ${
    status === 'error' ? 'border-red-200' : status === 'warning' ? 'border-amber-200' : 'border-slate-200'
  }`}>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
          status === 'ok' ? 'bg-emerald-50' : status === 'error' ? 'bg-red-50' : 'bg-amber-50'
        }`}>
          <Icon className={`w-5 h-5 ${
            status === 'ok' ? 'text-emerald-600' : status === 'error' ? 'text-red-500' : 'text-amber-500'
          }`} />
        </div>
        <span className="font-bold text-slate-800 text-sm">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusLight status={status} />
        <StatusBadge status={status} />
      </div>
    </div>
    <div className="space-y-1.5">{details}</div>
  </div>
);

const Detail = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex justify-between text-xs">
    <span className="text-slate-400 font-medium">{label}</span>
    <span className="text-slate-700 font-bold font-mono">{value}</span>
  </div>
);

export const OpsDiagnosticsTab: React.FC<OpsDiagnosticsTabProps> = ({ token }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/ops/diagnostics`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        setData(await res.json());
        setLastRefresh(new Date());
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDiagnostics(); }, [token]);

  if (loading && !data) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  const s = (key: string): ServiceStatus => {
    if (!data || !data[key]) return 'unknown';
    return data[key].status as ServiceStatus;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 font-medium">
          {lastRefresh ? `Last checked: ${lastRefresh.toLocaleTimeString()}` : 'Checking systems…'}
        </p>
        <button
          onClick={fetchDiagnostics}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ServiceCard
          icon={Database}
          name="SQL Database"
          status={s('sql_db')}
          details={
            data?.sql_db ? (
              <>
                <Detail label="Latency" value={`${data.sql_db.latency_ms ?? '—'}ms`} />
                <Detail label="Connections" value={`${data.sql_db.active_connections ?? '—'}`} />
                <Detail label="DB Size" value={`${data.sql_db.database_size_mb ?? '—'} MB`} />
                {data.sql_db.message && <Detail label="Message" value={data.sql_db.message} />}
              </>
            ) : <p className="text-xs text-slate-400">No data</p>
          }
        />

        <ServiceCard
          icon={Database}
          name="MongoDB"
          status={s('mongodb')}
          details={
            data?.mongodb ? (
              <>
                <Detail label="Latency" value={`${data.mongodb.latency_ms ?? '—'}ms`} />
                <Detail label="DB Size" value={`${data.mongodb.database_size_mb ?? '—'} MB`} />
                <Detail label="Collections" value={`${data.mongodb.collections_count ?? '—'}`} />
                <Detail label="Objects" value={`${data.mongodb.objects_count ?? '—'}`} />
                {data.mongodb.message && <Detail label="Message" value={data.mongodb.message} />}
              </>
            ) : <p className="text-xs text-slate-400">No data</p>
          }
        />

        <ServiceCard
          icon={Server}
          name="Redis Cache"
          status={s('redis')}
          details={
            data?.redis ? (
              <>
                <Detail label="Memory Used" value={`${data.redis.memory_used_mb ?? '—'} MB`} />
                <Detail label="Clients" value={`${data.redis.connected_clients ?? '—'}`} />
                <Detail label="Hits / Misses" value={`${data.redis.keyspace_hits ?? 0} / ${data.redis.keyspace_misses ?? 0}`} />
                {data.redis.message && <Detail label="Message" value={data.redis.message} />}
              </>
            ) : <p className="text-xs text-slate-400">No data</p>
          }
        />

        <ServiceCard
          icon={ActivitySquare}
          name="Celery Workers"
          status={s('celery')}
          details={
            data?.celery ? (
              <>
                <Detail label="Active Jobs" value={`${data.celery.active_jobs ?? 0}`} />
                <Detail label="Reserved Jobs" value={`${data.celery.reserved_jobs ?? 0}`} />
                <Detail label="Scheduled Jobs" value={`${data.celery.scheduled_jobs ?? 0}`} />
                {data.celery.message && <Detail label="Message" value={data.celery.message} />}
              </>
            ) : <p className="text-xs text-slate-400">No data</p>
          }
        />


        <ServiceCard
          icon={Cloud}
          name="Cloudinary Storage"
          status={s('cloudinary')}
          details={
            data?.cloudinary ? (
              <>
                <Detail label="Cloud Name" value={data.cloudinary.cloud_name || '—'} />
                {data.cloudinary.message && <Detail label="Message" value={data.cloudinary.message} />}
              </>
            ) : <p className="text-xs text-slate-400">No data</p>
          }
        />

        <ServiceCard
          icon={Zap}
          name="AI Pipeline (MediaPipe)"
          status={s('ai_pipeline')}
          details={
            data?.ai_pipeline ? (
              <>
                <Detail label="OpenCV Version" value={data.ai_pipeline.opencv_version || 'N/A'} />
                {data.ai_pipeline.message && <Detail label="Error" value={data.ai_pipeline.message} />}
              </>
            ) : <p className="text-xs text-slate-400">No data</p>
          }
        />

        <ServiceCard
          icon={Cpu}
          name="Server Resources"
          status={s('server')}
          details={
            data?.server ? (
              <>
                <Detail label="Uptime" value={`${data.server.uptime_days ?? '—'} days`} />
                <Detail label="CPU Load" value={data.server.load_average ? data.server.load_average.join(', ') : '—'} />
                <Detail label="RAM Usage" value={`${data.server.ram_used_gb}GB / ${data.server.ram_total_gb}GB (${data.server.ram_percent}%)`} />
                <Detail label="Disk" value={`${data.server.disk_used_gb}GB / ${data.server.disk_total_gb}GB (${data.server.disk_percent}%)`} />
                <Detail label="Network (In/Out)" value={`${data.server.net_recv_mb ?? 0} MB / ${data.server.net_sent_mb ?? 0} MB`} />
                {data.server.message && <Detail label="Error" value={data.server.message} />}
              </>
            ) : <p className="text-xs text-slate-400">No data</p>
          }
        />
      </div>
    </div>
  );
};

import { DetailSkeleton } from '../../../components/ui/index';
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, FileText, Database, MapPin } from 'lucide-react';
import PageHeader from '../../../components/portal/PageHeader';
import { policeApi } from '../../../api/police.api';

function DetailRow({ label, value, mono, span2 }) {
  const displayValue = (value === 'N/A' || !value) ? '-' : value;

  return (
    <div className={`p-3 bg-slate-50 border border-slate-200 rounded-xl ${span2 ? 'sm:col-span-2 lg:col-span-2' : ''}`}>
      <div className="text-xs tracking-wide text-slate-400 font-black mb-1 flex items-center gap-1.5 break-words">
        {label}
      </div>
      <div className={`text-sm text-slate-700 font-bold break-words ${mono ? 'font-mono text-sm' : ''}`}>{displayValue}</div>
    </div>
  );
}

function SectionHeading({ title, icon: Icon, badge }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 mt-8 pb-3 border-b border-slate-100">
      <Icon className="w-4 h-4 text-secondary" />
      <h3 className="font-heading font-black text-primary text-base tracking-wide">{title}</h3>
      {badge && <span className="ml-2 px-2.5 py-1 bg-slate-100 text-slate-500 text-sm font-bold tracking-wide rounded-md border border-slate-200">{badge}</span>}
    </div>
  );
}

function DynamicDataGrid({ data }) {
  if (!data || Object.keys(data).length === 0) return <DetailRow label="Status" value="No records found in database" />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 xl:grid-cols-4 gap-3">
      {Object.entries(data).map(([key, value]) => {
        const formattedKey = key.replace(/_/g, ' ').toUpperCase();
        const stringValue = (typeof value === 'object' && value !== null) ? JSON.stringify(value) : String(value);
        const isLongText = stringValue.length > 50;

        return <DetailRow key={key} label={formattedKey} value={stringValue} span2={isLongText} />;
      })}
    </div>
  );
}

function EpettyDetail() {
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRecord = useCallback(async () => {
    try {
      setLoading(true);
      const res = await policeApi.getEpettyRegistryById(id);
      if (res && res.success) {
        setRecord(res.data);
      } else {
        setRecord(null);
      }
    } catch (error) {
      console.error('Failed to fetch e-petty details:', error);
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  if (loading) return <DetailSkeleton />;

  if (!record) {
    return (
      <div className="p-8 text-center text-slate-500 font-semibold animate-fadeIn">
        <div className="mb-4">No matching e-petty record found in the database.</div>
        <Link to="/portal/epetty-register" className="text-blue-600 underline hover:text-blue-800 transition-colors">Back to E-petty Registry</Link>
      </div>
    );
  }

  const fName = record.offender_name || 'UNKNOWN';

  const personDetails = {
    name: record.offender_name,
    father_name: record.father_name,
    age: record.offender_age,
    sex: record.offender_sex,
    mobile: record.offender_mobile,
    occupation: record.offender_occupation
  };

  const locationDetails = {
    police_station: record.ps_name,
    unit: record.unit_name,
    house_number: record.house_number,
    street: record.street,
    village: record.village,
    permanent_address: record.offender_address,
    present_address: record.present_address
  };

  const caseDetails = {
    case_number: record.case_number,
    act_section: record.act_section,
    offence_date: record.offence_date,
    brief_facts: record.brief_facts,
    pid_cd: record.pid_cd,
    pid_name: record.pid_name
  };

  const disposalDetails = {
    charge_sheet_date: record.charge_sheet_date,
    disposal_status: record.disposal_type,
    disposal_date: record.disposal_date,
    remarks: record.disposal_remarks
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10 font-body">
      <PageHeader
        crumb={`Administration / E-petty Registry / ${record.case_number}`}
        title="E-petty Dossier"
        actions={
          <Link
            to="/portal/epetty-register"
            className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-500 hover:text-primary transition-all bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Registry
          </Link>
        }
      />

      {/* Hero Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-end justify-between gap-6 relative overflow-hidden shadow-sm">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight font-heading">{fName}</h1>
          </div>
          <div className="text-slate-500 font-bold flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-sm border border-slate-200">
              ID: {record.case_number}
            </span>
            <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-sm border border-slate-200">
              {record.ps_name}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <SectionHeading title="Person Demographics" icon={User} />
            <DynamicDataGrid data={personDetails} />
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <SectionHeading title="Offence & Location" icon={MapPin} />
            <DynamicDataGrid data={locationDetails} />
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <SectionHeading title="Case Information" icon={Database} />
            <DynamicDataGrid data={caseDetails} />
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Actions / Summary sidebar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-heading font-black text-slate-700">Disposal summary</h3>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                 <DetailRow label="Disposal Type" value={disposalDetails.disposal_status} />
                 <DetailRow label="Disposal Date" value={disposalDetails.disposal_date} />
                 <DetailRow label="Charge Sheet Date" value={disposalDetails.charge_sheet_date} />
                 <DetailRow label="Remarks" value={disposalDetails.remarks} span2 />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EpettyDetail;

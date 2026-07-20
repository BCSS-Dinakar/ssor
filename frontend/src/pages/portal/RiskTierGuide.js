import React from 'react';
import PageHeader from '../../components/portal/PageHeader';
import { TIERS } from '../../utils/data/portalData';
import { Shield, AlertTriangle, UserX, Network, FileText, Info, Clock, Scale } from 'lucide-react';

const tierDetails = {
  red: {
    icon: AlertTriangle,
    description: "Dangerous predator or gang offender. Applied to the most severe cases involving aggravated assault or gang involvement.",
    nature: "Rape, aggravated rape, gang rape, rape causing death or persistent vegetative state."
  },
  orange: {
    icon: UserX,
    description: "Repeat or habitual offender. Applied when any sexual offence is committed by a person with a prior conviction.",
    nature: "Any sexual offence with a prior conviction history."
  },
  blue: {
    icon: Network,
    description: "Cyber sexual offender. Covers online offenses, non-consensual transmission, and digital exploitation.",
    nature: "Online sexual abuse, CSAM (Child Sexual Abuse Material), non-consensual capture/transmission, online stalking."
  },
  black: {
    icon: Shield,
    description: "Organised crime or trafficking. Applied to rings, trafficking networks, and organized exploitation.",
    nature: "Human trafficking, organized commercial exploitation, kidnapping for exploitation."
  },
  pink: {
    icon: FileText,
    description: "Harassment and outraging modesty. Covers physical harassment and stalking offenses.",
    nature: "Sexual harassment, outraging modesty, physical stalking, voyeurism."
  },
  green: {
    icon: Info,
    description: "Isolated or low-severity offenders. The colour reflects a lower level of risk and a shorter period of retention rather than a distinct offence.",
    nature: "Single, non-aggravated incident by a person with no earlier record."
  }
};

function RiskTierGuide() {
  const availableTiers = Object.entries(TIERS).filter(([key]) => key !== 'silver');

  return (
    <div className="space-y-8 animate-fadeIn pb-12 w-full">
      <PageHeader
        crumb="Administration / Risk Tiers"
        title="Risk Tier Classification Guide"
        subtitle="Understanding the colour-coded classification system for offenders based on the State Sexual Offender Registry Concept Note."
      />

      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-base text-slate-700 shadow-sm">
        <p className="mb-2"><strong>Overview:</strong> The State Sexual Offender Registry uses a colour-coded scheme allowing officers to grade offenders by the seriousness of their conduct and the risk they carry. </p>
        <p className="text-slate-500"><strong>Note:</strong> Juveniles (Silver Tier) are dealt with under the Juvenile Justice Act, 2015, and are placed in no disclosable list. The "homosexual crimes" category does not exist in Indian law and orientation is never used for grading.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {availableTiers.map(([key, tier]) => {
          const details = tierDetails[key];
          const Icon = details.icon;
          
          return (
            <div key={key} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
              
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg text-white ${tier.color} shadow-sm`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">{tier.name} Tier</h3>
                    <p className="text-sm font-bold text-slate-500 tracking-wide">{tier.category}</p>
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-5 flex-1 flex flex-col space-y-5">
                
                {/* Description */}
                <div>
                  <h4 className="text-sm tracking-wide font-bold text-slate-400 mb-1">Defining Criteria</h4>
                  <p className="text-base text-slate-700 font-medium leading-relaxed">{details.description}</p>
                </div>
                
                {/* Nature */}
                <div>
                  <h4 className="text-sm tracking-wide font-bold text-slate-400 mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Nature of Offence
                  </h4>
                  <p className="text-base text-slate-700 font-medium leading-relaxed">{details.nature}</p>
                </div>

                <div className="flex-1"></div>
                
                {/* Footer Data */}
                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm tracking-wide font-bold text-slate-400 mb-2 flex items-center gap-1">
                      <Scale className="h-3 w-3" /> Statutory Provisions
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {tier.sections.map((section, idx) => (
                        <span key={idx} className="px-2 py-1 rounded-md text-sm font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {section}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm tracking-wide font-bold text-slate-400 mb-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Retention Limit
                    </h4>
                    <span className={`inline-block px-2.5 py-1 rounded-md text-sm font-bold ${tier.color.replace('bg-', 'bg-opacity-10 text-')} bg-opacity-10 border border-current`}>
                      {tier.retention}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RiskTierGuide;

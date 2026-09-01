using Common;
using System;
using System.Collections.Generic;
using System.Text;
using ThreatAnalysisService.Interfaces;

namespace ThreatAnalysisService.Services
{
    public class ThreatAnalysisService : IThreatAnalysis
    {
        public ThreatAnalysisService() { }
        public int RiskLevel(IncidentReport unit)
        {
            if(unit == null)
            {
                return 0;
            }
            if (unit.Intensity > 8)
            {
                return 5;
            }
            return 1;
    }
    }
}

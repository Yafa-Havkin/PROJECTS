using System;
using System.Collections.Generic;
using System.ServiceModel;
using System.Text;
using Common;

namespace ThreatAnalysisService.Interfaces
{
    [ServiceContract]
    public interface IThreatAnalysis
    {
        [OperationContract]
        public int RiskLevel(IncidentReport unit);
    }
}

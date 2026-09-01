using Common;
using System;
using System.Collections.Generic;
using System.Text;
using UnitManagerService.Interfaces;

namespace UnitManagerService.Services
{


    public class UnitManagerService: IUnitManager
    {

        public static List<IncidentReport> units = new List<IncidentReport>();
        public IncidentReport insertUnit(IncidentReport unit)
        {
            if (unit == null)
            {
                throw new ArgumentNullException(nameof(unit), "Unit cannot be null.");
            }
            var address = new System.ServiceModel.EndpointAddress("http://localhost:8733/ThreatService/");
            var binding = new System.ServiceModel.BasicHttpBinding();

            using (var factory = new System.ServiceModel.ChannelFactory<ThreatAnalysisService.Interfaces.IThreatAnalysis>(binding, address))
            {
                var client = factory.CreateChannel();

                int risk = client.RiskLevel(unit);

                unit.RiskLevel = risk;
            }
            units.Add(unit);
            return unit;
        }

        public IEnumerable<IncidentReport> getAllUnits()
        {
            return units;
        }
    }
}

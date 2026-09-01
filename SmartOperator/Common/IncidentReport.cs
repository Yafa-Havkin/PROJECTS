using System.Runtime.Serialization;

namespace Common
{
    [DataContract]
    public class IncidentReport
    {
        [DataMember]
        public string UnitName { get; set; }
        [DataMember]
        public string EventType { get; set; }
        [DataMember]
        public int Intensity { get; set; }
        [DataMember]
        public string Location { get; set; }
        [DataMember]
        public int RiskLevel { get; set; }

    }
}

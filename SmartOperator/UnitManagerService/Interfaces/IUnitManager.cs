using System;
using System.Collections.Generic;
using System.ServiceModel;
using System.Text;
using Common;

namespace UnitManagerService.Interfaces
{
    [ServiceContract(Namespace = "http://tempuri.org/")]
    public interface IUnitManager
    {
        [OperationContract]
        IncidentReport insertUnit(IncidentReport unit);
        [OperationContract]
        IEnumerable<IncidentReport> getAllUnits();
    }
}

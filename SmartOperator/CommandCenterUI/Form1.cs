using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.ServiceModel;
using Common;

namespace CommandCenterUI
{
    [ServiceContract]
    public interface IUnitManagerContract
    {
        [OperationContract]
        IncidentReport insertUnit(IncidentReport unit);
    }

    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private async void buttonReportAnIncident_Click(object sender, EventArgs e)
        {
            var binding = new BasicHttpBinding();
            var endpoint = new EndpointAddress("http://localhost:51974/UnitService"); var factory = new ChannelFactory<IUnitManagerContract>(binding, endpoint);
            var client = factory.CreateChannel();

            try
            {
                var report = new IncidentReport
                {
                    UnitName = txtUnitName.Text,
                    EventType = txtEventType.Text,
                    Location = string.Empty,
                    RiskLevel = 0
                };

                if (int.TryParse(txtIntensityLevel.Text, out var intensity))
                {
                    report.Intensity = intensity;
                }
                else
                {
                    MessageBox.Show("Invalid intensity level. Please enter a number.");
                    return;
                }

                await Task.Run(() => ((IUnitManagerContract)client).insertUnit(report));

                MessageBox.Show("הדיווח נשלח בהצלחה!");
            }
            catch (Exception ex)
            {
                MessageBox.Show("שגיאה בשליחת הדיווח: " + ex.Message);
            }
            finally
            {
                try
                {
                    ((IClientChannel)client).Close();
                    factory.Close();
                }
                catch
                {
                    try
                    {
                        ((IClientChannel)client).Abort();
                        factory.Abort();
                    }
                    catch { }
                }
            }
        }

        private void txtIntensityLevel_TextChanged(object sender, EventArgs e)
        {

        }
    }
}

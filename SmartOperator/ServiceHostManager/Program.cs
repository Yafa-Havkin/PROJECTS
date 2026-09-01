using CoreWCF.Configuration;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using UnitManagerService.Interfaces;
using CoreWCF;

var builder = WebApplication.CreateBuilder(args);

// הוספת שירותי WCF למערכת
builder.Services.AddServiceModelServices();

var app = builder.Build();

app.UseServiceModel(serviceBuilder =>
{
    serviceBuilder.AddService<UnitManagerService.Services.UnitManagerService>(serviceOptions =>
    {
        serviceOptions.DebugBehavior.IncludeExceptionDetailInFaults = true;
    });

    var binding = new BasicHttpBinding();
    serviceBuilder.AddServiceEndpoint<UnitManagerService.Services.UnitManagerService, IUnitManager>(
        binding, "/UnitService");
});

app.Run();
using Microsoft.AspNetCore.Mvc;
using SketchMind.Server.Data;
using SketchMind.Server.Models;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Text.Json;


namespace SketchMind.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    
    public class DrawingsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public DrawingsController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("generate")]
        public async Task<IActionResult> GenerateDrawing([FromBody] Drawing drawingRequest)
        {
            try
            {
                if (drawingRequest == null || string.IsNullOrEmpty(drawingRequest.Name))
                    return BadRequest("Name is required");

                var apiKey = _configuration["OpenRouter:ApiKey"];
                var modelName = _configuration["OpenRouter:ModelName"];

                var fallbackModels = new[]
                {
                    modelName,
                    "google/gemma-3-27b-it:free",
                    "google/gemma-3-12b-it:free",
                    "google/gemma-3-4b-it:free",
                    "meta-llama/llama-3.3-70b-instruct:free"
                }.Distinct().ToArray();

                string systemInstruction = @"You are a professional SVG Illustrator. 
GOAL: Draw the user's request accurately while staying strictly inside the canvas.

STRICT RULES:
1. Output ONLY raw <svg viewBox='0 0 500 500' xmlns='http://www.w3.org/2000/svg' style='background:white; overflow:hidden;'>...</svg>.
2. DYNAMIC DRAWING: Use your internal knowledge to draw what is requested using <circle>, <rect>, <path>, <polygon>, and <ellipse>.
3. ABSOLUTE BOUNDARIES: All coordinates and points must be between 50 and 450. NEVER touch the edges (0 or 500).
4. PROPORTIONS & ALIGNMENT:
   - Ground level is Y=400. All objects must sit on this line.
   - House: body <rect x='150' y='200' width='200' height='200'/>, roof <polygon points='130,200 370,200 250,80'/>
   - Person: head <circle cx='250' cy='320' r='20'/>, body <rect x='235' y='340' width='30' height='60'/>
   - Sun: <circle cx='400' cy='80' r='40' fill='yellow'/>
   - Tree: trunk <rect x='240' y='280' width='20' height='120'/>, leaves <circle cx='250' cy='250' r='50' fill='green'/>
5. PERSISTENCE: Always include 'Existing SVG' content. Add new objects on top.
6. NO TEXT: No markdown, no explanations, just the code.";

                string finalPrompt = $"{systemInstruction}---Existing SVG: {drawingRequest.HtmlContent}User Request: {drawingRequest.Name}---Generated SVG:";

                string? responseText = null;
                string? lastError = null;

                foreach (var model in fallbackModels)
                {
                    using var httpClient = new HttpClient();
                    httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

                    var requestBody = new
                    {
                        model = model,
                        messages = new[] { new { role = "user", content = finalPrompt } }
                    };

                    var response = await httpClient.PostAsync(
                        "https://openrouter.ai/api/v1/chat/completions",
                        new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json")
                    );

                    var responseBody = await response.Content.ReadAsStringAsync();
                    var json = JsonDocument.Parse(responseBody);

                    if (json.RootElement.TryGetProperty("error", out var errorElement))
                    {
                        var code = errorElement.TryGetProperty("code", out var codeEl) ? codeEl.GetInt32() : 500;
                        lastError = errorElement.GetProperty("message").GetString();
                        if (code == 429) continue; 
                        return StatusCode(code, lastError);
                    }

                    responseText = json.RootElement
                        .GetProperty("choices")[0]
                        .GetProperty("message")
                        .GetProperty("content")
                        .GetString() ?? "";
                    break;
                }

                if (responseText == null)
                    return StatusCode(429, lastError ?? "כל המודלים עמוסים, נסה שוב בעוד כמה שניות");

                string cleanSvg = responseText
                    .Replace("```html", "")
                    .Replace("```xml", "")
                    .Replace("```svg", "")
                    .Replace("```", "")
                    .Trim();

                return Ok(new { htmlContent = cleanSvg });
            }
            catch (Exception)
            {
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Drawing>>> GetUserDrawings([FromQuery] string? userId)
        {
            if (string.IsNullOrEmpty(userId))
                return BadRequest("userId is required");

            return await _context.Drawings
                .Where(d => d.UserId == userId)
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync();
        }
        [HttpPost]
        public async Task<ActionResult<Drawing>> PostDrawing(Drawing drawing)
        {
            _context.Drawings.Add(drawing);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetUserDrawings), new { id = drawing.Id }, drawing);
        }

        [HttpPost("send-email")]
        public async Task<IActionResult> SendEmail([FromBody] EmailRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.HtmlContent))
            {
                return BadRequest("פרטי הבקשה חסרים.");
            }

            try
            {
                var smtpServer = _configuration["SmtpSettings:Server"] ?? "smtp.gmail.com";
                var smtpPort = int.Parse(_configuration["SmtpSettings:Port"] ?? "587");
                var senderEmail = _configuration["SmtpSettings:SenderEmail"] ?? "";
                var senderName = _configuration["SmtpSettings:SenderName"] ?? "SketchMind";
                var appPassword = _configuration["SmtpSettings:AppPassword"] ?? "";

                using var smtpClient = new SmtpClient(smtpServer)
                {
                    Port = smtpPort,
                    Credentials = new NetworkCredential(senderEmail, appPassword),
                    EnableSsl = true,
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(senderEmail, senderName),
                    Subject = "🎨 הציור שלך מ-SketchMind מוכן!",
                    Body = $@"
                <div dir='rtl' style='font-family: ""Segoe UI"", Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;'>
                    <div style='background-color: #2c3e50; padding: 20px; text-align: center; color: white;'>
                        <h1 style='margin: 0;'>SketchMind AI</h1>
                    </div>
                    <div style='padding: 30px; text-align: center; background-color: #f9f9f9;'>
                        <p style='font-size: 18px; color: #333;'>היי! הנה היצירה שיצרת באפליקציה:</p>
                        <div style='background: white; padding: 15px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: inline-block; margin: 20px 0;'>
                            {request.HtmlContent}
                        </div>
                        <p style='color: #666; font-size: 14px;'>תוכל לשמור את הציור על ידי לחיצה ימנית ושמירה כתמונה.</p>
                    </div>
                    <div style='background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #999;'>
                        נשלח על ידי SketchMind v1.0 &copy; {DateTime.Now.Year}
                    </div>
                </div>",
                    IsBodyHtml = true,
                };

                mailMessage.To.Add(request.Email);

                await smtpClient.SendMailAsync(mailMessage);

                return Ok(new { message = "המייל נשלח בהצלחה!" });
            }
            catch (SmtpException smtpEx)
            {
                return BadRequest($"שגיאת שרת דואר: {smtpEx.Message}");
            }
            catch (Exception ex)
            {
                return BadRequest($"שגיאה כללית: {ex.Message}");
            }
        }
    }
}

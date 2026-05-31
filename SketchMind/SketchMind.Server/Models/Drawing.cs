using System;

namespace SketchMind.Server.Models
{
    public class Drawing
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string HtmlContent { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
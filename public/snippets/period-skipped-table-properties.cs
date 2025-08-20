// Period Skipped Table Properties
// C# model for handling skipped periods in AttendancePlus

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AttendancePlus.Models
{
    [Table("PeriodSkipped")]
    public class PeriodSkipped
    {
        [Key]
        public int SkippedId { get; set; }

        [Required]
        public int StudentId { get; set; }

        [Required]
        public int PeriodId { get; set; }

        [Required]
        public int ClassId { get; set; }

        [Required]
        [Column(TypeName = "date")]
        public DateTime SkippedDate { get; set; }

        [Required]
        [StringLength(50)]
        public string Reason { get; set; }

        [StringLength(500)]
        public string Notes { get; set; }

        [Required]
        [StringLength(450)]
        public string CreatedBy { get; set; }

        [Required]
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        [StringLength(450)]
        public string ModifiedBy { get; set; }

        public DateTime? ModifiedDate { get; set; }

        [Required]
        public bool IsActive { get; set; } = true;

        // Navigation properties
        [ForeignKey("StudentId")]
        public virtual Student Student { get; set; }

        [ForeignKey("PeriodId")]
        public virtual Period Period { get; set; }

        [ForeignKey("ClassId")]
        public virtual Class Class { get; set; }

        // Additional properties for business logic
        [NotMapped]
        public string StudentName => Student != null ? $"{Student.FirstName} {Student.LastName}" : string.Empty;

        [NotMapped]
        public string PeriodName => Period?.PeriodName ?? string.Empty;

        [NotMapped]
        public string ClassName => Class?.ClassName ?? string.Empty;

        [NotMapped]
        public bool CanBeModified => CreatedDate.AddHours(24) > DateTime.UtcNow;

        // Validation methods
        public bool IsValidSkipReason()
        {
            var validReasons = new[] { "Medical", "Emergency", "Excused", "Administrative", "Other" };
            return Array.Exists(validReasons, r => r.Equals(Reason, StringComparison.OrdinalIgnoreCase));
        }

        public bool IsSkipDateValid()
        {
            return SkippedDate <= DateTime.Today && SkippedDate >= DateTime.Today.AddDays(-30);
        }
    }

    // DTO for API responses
    public class PeriodSkippedDto
    {
        public int SkippedId { get; set; }
        public int StudentId { get; set; }
        public string StudentName { get; set; }
        public string StudentNumber { get; set; }
        public int PeriodId { get; set; }
        public string PeriodName { get; set; }
        public int ClassId { get; set; }
        public string ClassName { get; set; }
        public DateTime SkippedDate { get; set; }
        public string Reason { get; set; }
        public string Notes { get; set; }
        public string CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; }
        public bool CanBeModified { get; set; }
    }

    // Request model for creating/updating skipped periods
    public class PeriodSkippedRequest
    {
        [Required]
        public int StudentId { get; set; }

        [Required]
        public int PeriodId { get; set; }

        [Required]
        public int ClassId { get; set; }

        [Required]
        public DateTime SkippedDate { get; set; }

        [Required]
        [StringLength(50)]
        public string Reason { get; set; }

        [StringLength(500)]
        public string Notes { get; set; }
    }
}

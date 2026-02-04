using FluentValidation;
using Models;

namespace API.Validators
{
    public class CustomerValidator : AbstractValidator<Customer>
    {
        public CustomerValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Name is required")
                .Length(2, 100).WithMessage("Name must be between 2 and 100 characters");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Invalid email format");

            RuleFor(x => x.Phone)
                .Matches(@"^[\d\-\+\(\)\s]+$").WithMessage("Invalid phone format")
                .When(x => !string.IsNullOrEmpty(x.Phone));
        }
    }
}
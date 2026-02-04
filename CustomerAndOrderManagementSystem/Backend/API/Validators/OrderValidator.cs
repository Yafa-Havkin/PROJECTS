using FluentValidation;
using Models;

namespace API.Validators
{
    public class OrderValidator : AbstractValidator<Order>
    {
        public OrderValidator()
        {
            RuleFor(x => x.CustomerId)
                .GreaterThan(0).WithMessage("Customer ID must be greater than 0");

            RuleFor(x => x.TotalAmount)
                .GreaterThan(0).WithMessage("Total amount must be greater than 0")
                .LessThan(1000000).WithMessage("Total amount cannot exceed 1,000,000");

            RuleFor(x => x.OrderDate)
                .NotEmpty().WithMessage("Order date is required");
        }
    }
}
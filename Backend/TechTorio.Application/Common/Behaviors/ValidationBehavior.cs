using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using ValidationException = TechTorio.Application.Common.Exceptions.ValidationException;

namespace TechTorio.Application.Common.Behaviors;

public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;
    private readonly ILogger<ValidationBehavior<TRequest, TResponse>> _logger;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators, ILogger<ValidationBehavior<TRequest, TResponse>> logger)
    {
        _validators = validators;
        _logger = logger;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        if (_validators.Any())
        {
            var context = new ValidationContext<TRequest>(request);

            _logger.LogDebug("Running validation for {RequestType} with {ValidatorCount} validators", 
                typeof(TRequest).Name, _validators.Count());

            var validationResults = await Task.WhenAll(
                _validators.Select(v => v.ValidateAsync(context, cancellationToken)));

            var failures = validationResults
                .SelectMany(r => r.Errors)
                .Where(f => f != null)
                .ToList();

            if (failures.Count != 0)
            {
                // Log each validation failure separately for better debugging
                foreach (var failure in failures)
                {
                    _logger.LogWarning("Validation failure - Property: '{PropertyName}', Error: '{ErrorMessage}', AttemptedValue: '{AttemptedValue}'", 
                        failure.PropertyName, failure.ErrorMessage, failure.AttemptedValue);
                }
                
                _logger.LogWarning("Validation failed for {RequestType}. Failures: {Failures}", 
                    typeof(TRequest).Name,
                    string.Join(" | ", failures.Select(f => $"{f.PropertyName}: {f.ErrorMessage}")));
                
                throw new ValidationException(failures);
            }
            
            _logger.LogDebug("Validation passed for {RequestType}", typeof(TRequest).Name);
        }

        return await next();
    }
}
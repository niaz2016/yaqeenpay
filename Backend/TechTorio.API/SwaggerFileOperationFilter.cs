using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

public class SwaggerFileOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var fileParams = context.MethodInfo.GetParameters()
            .Where(p => p.ParameterType == typeof(Microsoft.AspNetCore.Http.IFormFile))
            .ToArray();

        if (fileParams.Length == 0)
            return;

        // Remove any parameters that are IFormFile type from the operation
        if (operation.Parameters != null)
        {
            var parametersToRemove = operation.Parameters
                .Where(p => context.MethodInfo.GetParameters()
                    .Any(param => param.Name == p.Name && param.ParameterType == typeof(Microsoft.AspNetCore.Http.IFormFile)))
                .ToList();
            
            foreach (var param in parametersToRemove)
            {
                operation.Parameters.Remove(param);
            }
        }

        // Set up multipart/form-data request body
        operation.RequestBody = new OpenApiRequestBody
        {
            Content = new Dictionary<string, OpenApiMediaType>
            {
                ["multipart/form-data"] = new OpenApiMediaType
                {
                    Schema = new OpenApiSchema
                    {
                        Type = "object",
                        Properties = fileParams.ToDictionary(
                            k => k.Name!,
                            v => new OpenApiSchema
                            {
                                Type = "string",
                                Format = "binary"
                            }
                        ),
                        Required = fileParams.Select(p => p.Name!).ToHashSet()
                    }
                }
            }
        };
    }
}
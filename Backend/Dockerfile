# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build

WORKDIR /src

# Copy solution and NuGet config early to leverage layer caching
COPY NuGet.Config ./
COPY YaqeenPay.sln ./

# Copy project files
COPY YaqeenPay.API/*.csproj ./YaqeenPay.API/
COPY YaqeenPay.Application/*.csproj ./YaqeenPay.Application/
COPY YaqeenPay.Domain/*.csproj ./YaqeenPay.Domain/
COPY YaqeenPay.Infrastructure/*.csproj ./YaqeenPay.Infrastructure/
COPY YaqeenPay.Shared/*.csproj ./YaqeenPay.Shared/

# Prevent usage of host-specific fallback package folders
ENV NUGET_PACKAGES=/root/.nuget/packages \
	DOTNET_CLI_TELEMETRY_OPTOUT=1 \
	DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1

# Restore dependencies using our custom NuGet.Config
RUN dotnet restore --configfile NuGet.Config

# Copy source code
COPY . .

# Ensure no pre-existing obj/bin (in case .dockerignore missed anything)
RUN find . -type d \( -name bin -o -name obj \) -prune -exec rm -rf {} + || true

# Build the application
RUN dotnet build -c Release --no-restore

# Publish the application
RUN dotnet publish YaqeenPay.API/YaqeenPay.API.csproj -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime

WORKDIR /app

# Create a non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy published application
COPY --from=build /app/publish .

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Start the application
ENTRYPOINT ["dotnet", "YaqeenPay.API.dll"]
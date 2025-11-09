# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

# Copy solution and NuGet config early to leverage layer caching
COPY NuGet.Config ./
COPY TechTorio.sln ./

# Copy project files
COPY TechTorio.API/*.csproj ./TechTorio.API/
COPY TechTorio.Application/*.csproj ./TechTorio.Application/
COPY TechTorio.Domain/*.csproj ./TechTorio.Domain/
COPY TechTorio.Infrastructure/*.csproj ./TechTorio.Infrastructure/
COPY TechTorio.Shared/*.csproj ./TechTorio.Shared/

# Prevent usage of host-specific fallback package folders
ENV NUGET_PACKAGES=/root/.nuget/packages \
	DOTNET_CLI_TELEMETRY_OPTOUT=1 \
	DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1

# Restore dependencies using our custom NuGet.Config
# Explicitly clear RestoreFallbackFolders to avoid Windows-specific DevExpress offline paths during container builds
RUN dotnet restore --configfile NuGet.Config -p:RestoreFallbackFolders=

# Copy source code
COPY . .

# Build the application (explicitly specify solution to avoid MSB1011)
RUN dotnet build TechTorio.sln -c Release --no-restore

# Publish the application (output to /app/publish)
RUN dotnet publish TechTorio.API/TechTorio.API.csproj -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app

# Create a non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

 # Copy published output directly (simpler and avoids potential file corruption edge cases)
COPY --from=build /app/publish/. /app/

# Create Documents directory and change ownership to non-root user
RUN mkdir -p /app/Documents && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Start the application
ENTRYPOINT ["dotnet", "TechTorio.API.dll"]
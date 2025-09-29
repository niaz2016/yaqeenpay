namespace YaqeenPay.Infrastructure.Services.Security;

public class JwtKeyMaterial
{
    // Base64-encoded DER (SubjectPublicKeyInfo) public key
    public string? PublicKeyBase64 { get; set; }
    // Base64-encoded DER (PKCS#8) private key
    public string? PrivateKeyBase64 { get; set; }
    public string? KeyId { get; set; }
}

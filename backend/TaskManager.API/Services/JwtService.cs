using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using TaskManager.API.Models;

namespace TaskManager.API.Services;

public class JwtService(IConfiguration config, string jwtKey)
{
    private readonly SymmetricSecurityKey _key = new(Encoding.UTF8.GetBytes(jwtKey));

    public string GenerateToken(User user)
    {
        var creds = new SigningCredentials(_key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim("isAdmin", user.IsAdmin.ToString().ToLower())
        };

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

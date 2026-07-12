using System.ComponentModel.DataAnnotations;

namespace TaskManager.API.DTOs;

public record RegisterDto(
    [Required, StringLength(50, MinimumLength = 3)] string Username,
    [Required, EmailAddress] string Email,
    [Required, StringLength(100, MinimumLength = 8), RegularExpression(
        @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).+$",
        ErrorMessage = "Password must have uppercase, lowercase, digit and special character.")]
    string Password);

public record LoginDto(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public record AuthResponseDto(string Token, string Username, string Email);

public record UpdateProfileDto(string? Username, string? CurrentPassword,
    [StringLength(100, MinimumLength = 8), RegularExpression(
        @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).+$",
        ErrorMessage = "Password must have uppercase, lowercase, digit and special character.")]
    string? NewPassword);

namespace BizConnect.Domain.Businesses;

public static class PostKinds { public const string Text = "text", Image = "image", Video = "video", Product = "product", Announcement = "announcement"; public static readonly string[] All = [Text, Image, Video, Product, Announcement]; }
public static class PostAudiences { public const string Public = "public", Followers = "followers", Private = "private"; public static readonly string[] All = [Public, Followers, Private]; }

public sealed class Post
{
    public Guid Id { get; set; }
    public Guid AuthorUserId { get; set; }
    public Guid? BusinessId { get; set; }
    public string Kind { get; set; } = PostKinds.Text;
    public string Audience { get; set; } = PostAudiences.Public;
    public bool Discoverable { get; set; } = true;
    public bool AllowComments { get; set; } = true;
    public string Text { get; set; } = string.Empty;
    public string? Location { get; set; }
    public string? ProductJson { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public ICollection<PostMediaReference> Media { get; set; } = new List<PostMediaReference>();
}
public sealed class PostMediaReference
{
    public Guid Id { get; set; }
    public Guid PostId { get; set; }
    public string MediaType { get; set; } = "image";
    public string Url { get; set; } = string.Empty;
    public string? AltText { get; set; }
    public int SortOrder { get; set; }
}
public sealed class PostLike { public Guid PostId { get; set; } public Guid UserId { get; set; } public DateTimeOffset CreatedAtUtc { get; set; } }
public sealed class SocialComment
{
    public Guid Id { get; set; }
    public Guid PostId { get; set; }
    public Guid AuthorUserId { get; set; }
    public Guid? ParentCommentId { get; set; }
    public string Text { get; set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}
public sealed class SocialPoll
{
    public Guid Id { get; set; }
    public Guid PostId { get; set; }
    public string Question { get; set; } = string.Empty;
    public DateTimeOffset? ClosesAtUtc { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public ICollection<PollOption> Options { get; set; } = new List<PollOption>();
}
public sealed class PollOption { public Guid Id { get; set; } public Guid PollId { get; set; } public string Text { get; set; } = string.Empty; public int SortOrder { get; set; } }
public sealed class PollVote { public Guid PollId { get; set; } public Guid OptionId { get; set; } public Guid UserId { get; set; } public DateTimeOffset CreatedAtUtc { get; set; } }
public sealed class UserFollow { public Guid FollowerUserId { get; set; } public Guid FollowedUserId { get; set; } public DateTimeOffset CreatedAtUtc { get; set; } }
public sealed class BusinessFollow { public Guid UserId { get; set; } public Guid BusinessId { get; set; } public DateTimeOffset CreatedAtUtc { get; set; } }
public sealed class UserBlock { public Guid BlockerUserId { get; set; } public Guid BlockedUserId { get; set; } public DateTimeOffset CreatedAtUtc { get; set; } }
public sealed class HiddenPost { public Guid UserId { get; set; } public Guid PostId { get; set; } public DateTimeOffset CreatedAtUtc { get; set; } }

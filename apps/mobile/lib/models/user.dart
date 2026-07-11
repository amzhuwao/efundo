class User {
  const User({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    required this.status,
    this.programId,
    this.year,
    this.educationLevel,
  });

  final String id;
  final String email;
  final String fullName;
  final String role;
  final String status;
  final String? programId;
  final int? year;
  final String? educationLevel;

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      fullName: json['fullName'] as String,
      role: json['role'] as String,
      status: json['status'] as String,
      programId: json['programId'] as String?,
      year: json['year'] as int?,
      educationLevel: json['educationLevel'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'fullName': fullName,
        'role': role,
        'status': status,
        'programId': programId,
        'year': year,
        'educationLevel': educationLevel,
      };

  String get firstName => fullName.split(' ').first;
}

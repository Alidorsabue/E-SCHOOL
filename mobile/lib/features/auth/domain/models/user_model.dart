class UserModel {
  final int id;
  final String username;
  final String email;
  final String firstName;
  final String lastName;
  final String role;
  final String? phone;
  final String? schoolCode;
  final String? studentId;
  final String? profilePicture;

  UserModel({
    required this.id,
    required this.username,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    this.phone,
    this.schoolCode,
    this.studentId,
    this.profilePicture,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'],
      username: json['username'],
      email: json['email'],
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
      role: json['role'],
      phone: json['phone'],
      schoolCode: json['school_code'],
      studentId: json['student_id'],
      profilePicture: json['profile_picture'],
    );
  }

  String get fullName => '$firstName $lastName';
  
  bool get isStudent => role == 'STUDENT';
  bool get isParent => role == 'PARENT';
  bool get isTeacher => role == 'TEACHER';
  bool get isAdmin => role == 'ADMIN';
}

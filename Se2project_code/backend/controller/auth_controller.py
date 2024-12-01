from flask import jsonify, request, session # type: ignore
from werkzeug.security import generate_password_hash, check_password_hash # type: ignore
from model.user import User
import re

def register():
    """Handles user registration."""
    first_name = request.json.get('first_name')
    last_name = request.json.get('last_name')
    email = request.json.get('email')
    password = request.json.get('password')
    confirm_password = request.json.get('confirm_password')
    user_type = request.json.get('user_type')

    # Validate input fields
    if not (first_name and last_name and email and password and confirm_password and user_type):
        return jsonify({"error": "All fields are required"}), 400

    if password != confirm_password:
        return jsonify({"error": "Passwords do not match"}), 400

    try:
        # Determine user status based on type
        status = "approved" if user_type == "student" else "pending"

        # Check if the email is already in use
        existing_user = User.objects(email=email).first()
        if existing_user:
            return jsonify({"error": "User with this email already exists"}), 409

        # Create a new user
        user = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            username=email.split('@')[0],
            password=generate_password_hash(password),
            user_type=user_type,
            status=status
        )
        user.save()

        # Return appropriate message
        if status == "pending":
            return jsonify({"message": "Your request for registration is pending. Please wait for approval."}), 202
        else:
            return jsonify({"message": "User registered successfully!"}), 201

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


def login():
    """Handles user login."""
    identifier = request.json.get('username')  # Can be username or email
    password = request.json.get('password')

    # Determine if identifier is an email
    if re.match(r"[^@]+@[^@]+\.[^@]+", identifier):
        user = User.objects(email=identifier).first()
    else:
        user = User.objects(username=identifier).first()

    # Validate user existence and password
    if user and check_password_hash(user.password, password):
        # Check if the user has a pending status
        if hasattr(user, 'status') and user.status == "pending":
            return jsonify({"error": "Your registration is pending approval."}), 403

        # Set session details
        session['user_id'] = str(user.id)
        session['username'] = user.username
        session['user_type'] = user.user_type
        session.permanent = True  # Ensure session persistence
        return jsonify({
            "message": "Login successful!",
            "user_type": user.user_type,
            "username": user.username
        }), 200

    # Handle invalid login credentials
    return jsonify({"error": "Invalid username/email or password"}), 401

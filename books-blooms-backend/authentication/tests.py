from django.test import TestCase

from rest_framework.test import APIClient
# Create your tests here.



class RegistrationTest(TestCase):

    def test_registration(self):
        client = APIClient()

        response = client.post(
            "/api/register/",
            {
                "first_name": "Alex",
                "last_name": "Smith",
                "email": "alex@example.com",
                "password": "BookBloom@123"
            },
            format="json"
        )

        self.assertEqual(response.status_code, 201)
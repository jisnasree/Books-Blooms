
Super User can make someone admin

When super use is logged in 
    Navigates to user section of dashboard
        Searches a specific user
            Selects the button make admin


is admin button visible only super user is logged in 

Backend exposes a admin/staff api which only works for super user.
When a post message for staff is called the backend should check if the current user is a super user and also authenticated
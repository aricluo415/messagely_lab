const $form = $("#registration-form");


async function processForm(evt) {
    evt.preventDefault();

    let data = {
        username: $("#username").val(),
        first_name: $("#first_name").val(),
        last_name: $("#last_name").val(),
        phone: $("#phone").val(),
        password: $("#password").val()
    };

    let response = await axios.post("http://localhost:3000/auth/register", data);
    console.log(response);

}




$form.on("submit", evt => processForm(evt));
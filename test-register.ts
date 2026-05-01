async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentName: "John",
        dob: "2010-01-01",
        parentName: "Jane",
        parentEmail: "jane@example.com",
        parentPhone: "123",
        school: "School",
        studentClass: "Primary 4",
        teacherName: "Bob",
        teacherEmail: "bob@example.com",
        teacherPhone: "321"
      })
    });
    console.log(res.status);
    console.log(await res.text());
  } catch (e) {
    console.error(e);
  }
}
test();

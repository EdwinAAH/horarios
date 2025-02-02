// Importar Firebase
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD2SaT5TG6LnwOZnjmG9u45mcKiiOdRy20",
    authDomain: "apphorarios-118b3.firebaseapp.com",
    projectId: "apphorarios-118b3",
    storageBucket: "apphorarios-118b3.appspot.com",
    messagingSenderId: "261247183658",
    appId: "1:261247183658:web:ae2518176540e3409ecc53",
    measurementId: "G-C7Z972GY1J"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referencias al DOM
const loginForm = document.getElementById("loginForm");
const loginSection = document.getElementById("loginSection");
const scheduleSection = document.getElementById("scheduleSection");
const groupButtons = document.querySelectorAll("#scheduleSection button");
const profileSection = document.getElementById("profileSection");
const profileForm = document.getElementById("profileForm");
const toggleProfileButton = document.getElementById("toggleProfileButton");
const adminSection = document.getElementById("adminSection");
const clearGroupsButton = document.getElementById("clearGroupsButton");
const runSortButton = document.getElementById("runSortButton");

// Variable global para almacenar datos del usuario
let userDoc = null;

// Mapeo de horarios para cada grupo
const groupSchedules = {
    group1: "2:30 - 3:00 PM",
    group2: "3:00 - 3:30 PM",
    group3: "3:30 - 4:00 PM",
};

// Manejar inicio de sesión
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const nip = document.getElementById("nip").value.trim();

    try {
        // Consultar Firestore
        const q = query(
            collection(db, "users"),
            where("username", "==", username),
            where("nip", "==", nip)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            querySnapshot.forEach((doc) => {
                userDoc = { id: doc.id, ...doc.data() };
            });

            // Ocultar la sección de inicio de sesión
            loginSection?.classList.add("d-none");

            // Mostrar la sección de selección de grupo
            scheduleSection?.classList.remove("d-none");

            // Mostrar el botón para editar perfil
            toggleProfileButton?.classList.remove("d-none");

            // Mostrar la sección de administración si el usuario es admin
            if (userDoc.userType === "admin") {
                adminSection?.classList.remove("d-none");
            }

            // Prellenar los campos de edición de perfil
            fillProfileForm();

            // Verificar el estado del grupo del usuario
            checkGroupStatus();
        } else {
            alert("Nombre de usuario o NIP incorrectos.");
        }
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        alert("Ocurrió un error al iniciar sesión.");
    }
});

// Prellenar el formulario de edición de perfil
function fillProfileForm() {
    document.getElementById("newUsername").value = userDoc.username || "";
    document.getElementById("newNip").value = userDoc.nip || "";
    document.getElementById("newPublicName").value = userDoc.publicName || "";
}

// Manejar la actualización del perfil
profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newUsername = document.getElementById("newUsername").value.trim();
    const newNip = document.getElementById("newNip").value.trim();
    const newPublicName = document.getElementById("newPublicName").value.trim();

    if (!userDoc) {
        alert("No se ha identificado al usuario.");
        return;
    }

    try {
        // Actualizar Firestore
        const userRef = doc(db, "users", userDoc.id);
        await updateDoc(userRef, {
            username: newUsername,
            nip: newNip,
            publicName: newPublicName,
        });

        // Actualizar localmente
        userDoc.username = newUsername;
        userDoc.nip = newNip;
        userDoc.publicName = newPublicName;

        alert("Datos actualizados correctamente.");
    } catch (error) {
        console.error("Error al actualizar el perfil:", error);
        alert("Ocurrió un error al actualizar los datos.");
    }
});

// Manejar visibilidad del botón de perfil
toggleProfileButton.addEventListener("click", () => {
    if (profileSection.classList.contains("d-none")) {
        profileSection.classList.remove("d-none");
        toggleProfileButton.textContent = "Ocultar Perfil";
    } else {
        profileSection.classList.add("d-none");
        toggleProfileButton.textContent = "Editar Perfil";
    }
});

// Manejar la selección de grupo
groupButtons.forEach((button) => {
    button.addEventListener("click", async () => {
        if (!userDoc) {
            alert("No se ha identificado al usuario.");
            return;
        }

        const groupId = button.id; // ID del botón
        try {
            // Actualizar Firestore
            const userRef = doc(db, "users", userDoc.id);
            await updateDoc(userRef, { group: groupId, lastSelection: new Date().toISOString() });
            userDoc.group = groupId; // Actualizar localmente

            // Mostrar mensaje de selección
            handleGroupSelection(groupId);
        } catch (error) {
            console.error("Error al seleccionar el grupo:", error);
            alert("Ocurrió un error al guardar tu selección.");
        }
    });
});

// Mostrar mensaje de selección de grupo
function handleGroupSelection(groupId) {
    groupButtons.forEach((button) => button.classList.add("d-none"));
    document.querySelector(".group-message")?.remove();

    const message = document.createElement("p");
    message.textContent = `Seleccionaste el grupo ${groupId.replace(
        "group",
        ""
    )}: ${groupSchedules[groupId]}`;
    message.classList.add("mt-3", "text-info", "group-message");
    scheduleSection.appendChild(message);
}

// Mostrar mensaje del grupo asignado con los integrantes
async function handleGroupAssignment(groupId) {
    groupButtons.forEach((button) => button.classList.add("d-none"));
    document.querySelector(".group-message")?.remove();

    try {
        const q = query(collection(db, "users"), where("group", "==", groupId));
        const querySnapshot = await getDocs(q);

        const groupMembers = [];
        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            if (userData.publicName) {
                groupMembers.push(userData.publicName); // Usar el nombre público
            }
        });

        const message = document.createElement("p");
        message.textContent = `Quedaste en el grupo ${groupId.replace(
            "group",
            ""
        )}: ${groupSchedules[groupId]}`;
        message.classList.add("mt-3", "text-success", "group-message");
        scheduleSection.appendChild(message);

        if (groupMembers.length > 0) {
            const membersMessage = document.createElement("p");
            membersMessage.textContent = `Integrantes de tu grupo: ${groupMembers.join(
                ", "
            )}`;
            membersMessage.classList.add("mt-2", "text-secondary", "group-message");
            scheduleSection.appendChild(membersMessage);
        }
    } catch (error) {
        console.error("Error al obtener los integrantes del grupo:", error);
        alert("No se pudieron cargar los integrantes del grupo.");
    }
}

// Borrar grupos seleccionados
clearGroupsButton.addEventListener("click", async () => {
    if (userDoc.userType !== "admin") return;

    try {
        const usersSnapshot = await getDocs(collection(db, "users"));

        // Borrar el campo `group` de todos los usuarios
        const batch = usersSnapshot.docs.map((doc) =>
            updateDoc(doc.ref, { group: null })
        );

        await Promise.all(batch);

        // Resetear grupo en local
        userDoc.group = null;

        alert("Grupos borrados.");

        // Actualizar la interfaz
        clearGroupMessages(); // Elimina los mensajes de grupos actuales
        checkGroupStatus(); // Restaura los botones de selección de grupo
    } catch (error) {
        console.error("Error al borrar los grupos:", error);
        alert("Ocurrió un error al borrar los grupos.");
    }
});

// Función para limpiar los mensajes de grupo
function clearGroupMessages() {
    // Eliminar mensajes de grupo existentes
    document.querySelectorAll(".group-message").forEach((message) => {
        message.remove();
    });
}

// Verificar el estado del grupo del usuario
function checkGroupStatus() {
    if (userDoc.group) {
        handleGroupAssignment(userDoc.group);
    } else {
        groupButtons.forEach((button) => button.classList.remove("d-none"));
        document.querySelector(".group-message")?.remove();
    }
}

// Realizar el sorteo
runSortButton.addEventListener("click", async () => {
    if (userDoc.userType !== "admin") return;

    const usersSnapshot = await getDocs(collection(db, "users"));
    const group1 = [];
    const group2 = [];
    const group3 = [];
    const ungrouped = [];

    usersSnapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.group) ungrouped.push(doc);
        else if (data.group === "group1") group1.push(doc);
        else if (data.group === "group2") group2.push(doc);
        else if (data.group === "group3") group3.push(doc);
    });

    for (const user of ungrouped) {
        if (group1.length < 6) {
            group1.push(user);
            await updateDoc(user.ref, { group: "group1" });
        } else if (group2.length < 6) {
            group2.push(user);
            await updateDoc(user.ref, { group: "group2" });
        } else if (group3.length < 6) {
            group3.push(user);
            await updateDoc(user.ref, { group: "group3" });
        }
    }

    alert("Sorteo completado.");
    checkGroupStatus();
});
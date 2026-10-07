const initializePage = () => {
    if (window.lucide) {
        window.lucide.createIcons();
    } else {
        console.error("Lucide icons could not be initialized because the library failed to load.");
    }

    const menuToggle = document.getElementById("menu-toggle");
    const mobileMenu = document.getElementById("mobile-menu");

    menuToggle.addEventListener("click", () => {
        const isOpen = !mobileMenu.classList.contains("hidden");
        mobileMenu.classList.toggle("hidden", isOpen);
        menuToggle.setAttribute("aria-expanded", String(!isOpen));
    });

    document.querySelectorAll("#mobile-menu a").forEach((link) => {
        link.addEventListener("click", () => {
            mobileMenu.classList.add("hidden");
            menuToggle.setAttribute("aria-expanded", "false");
        });
    });

    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;
    const terminalGroups = Array.from(
        document.querySelectorAll("[data-hero-terminal] [data-terminal-group]"),
    ).map((group) => ({
        command: group.querySelector("[data-terminal-command]"),
        outputs: Array.from(group.querySelectorAll("[data-terminal-output]")),
    }));

    if (terminalGroups.length && !reduceMotion) {
        const terminalLines = terminalGroups.flatMap(({ command, outputs }) => [
            command,
            ...outputs,
        ]);
        const terminalText = new Map(
            terminalLines.map((line) => [line, line.textContent.trim()]),
        );
        const pause = (duration) =>
            new Promise((resolve) => window.setTimeout(resolve, duration));
        const typeLine = async (line, text, interval) => {
            for (const character of text) {
                line.textContent += character;
                await pause(interval);
            }
        };

        terminalLines.forEach((line) => {
            line.textContent = "";
        });

        const animateTerminal = async () => {
            while (true) {
                for (const { command, outputs } of terminalGroups) {
                    await typeLine(command, terminalText.get(command), 28);
                    await pause(260);
                    for (const output of outputs) {
                        await typeLine(output, terminalText.get(output), 16);
                        await pause(180);
                    }
                    await pause(420);
                }
                await pause(1800);
                terminalLines.forEach((line) => {
                    line.textContent = "";
                });
                await pause(600);
            }
        };

        void animateTerminal();
    }

    const profileImage = document.querySelector(".hero-profile-image");
    const profileSlot = document.querySelector(".hero-profile-slot");
    const profileHome = document.getElementById("profile-home");
    let profileImageAtHome = false;
    let profileImageMoving = false;
    let profileMoveFrame = 0;
    let profileDestination = null;

    const setProfileImageRect = (rect) => {
        profileImage.style.left = `${rect.left}px`;
        profileImage.style.top = `${rect.top}px`;
        profileImage.style.width = `${rect.width}px`;
        profileImage.style.height = `${rect.height}px`;
    };

    const finishProfileImageMove = () => {
        profileImageMoving = false;
        if (profileImageAtHome) {
            return;
        }

        profileSlot.append(profileImage);
        profileImage.classList.remove("is-transitioning");
        profileImage.style.removeProperty("left");
        profileImage.style.removeProperty("top");
        profileImage.style.removeProperty("width");
        profileImage.style.removeProperty("height");
        profileHome.classList.remove("profile-image-active");
    };

    const moveProfileImage = (toNavbar, animate = true) => {
        if (!toNavbar && profileImage.parentElement === profileSlot) {
            return;
        }

        profileImageAtHome = toNavbar;
        if (toNavbar) {
            profileHome.classList.add("profile-image-active");
        }
        const source = profileImage.getBoundingClientRect();
        const destination = toNavbar
            ? profileHome.getBoundingClientRect()
            : profileSlot.getBoundingClientRect();
        profileDestination = destination;

        if (profileMoveFrame) {
            window.cancelAnimationFrame(profileMoveFrame);
            profileMoveFrame = 0;
        }

        if (profileImage.parentElement === document.body) {
            profileImage.style.transition = "none";
            setProfileImageRect(source);
            void profileImage.offsetWidth;
            profileImage.style.removeProperty("transition");
        } else {
            profileImage.classList.add("is-transitioning");
            setProfileImageRect(source);
            document.body.append(profileImage);
        }

        if (!animate) {
            setProfileImageRect(destination);
            finishProfileImageMove();
            return;
        }

        profileImageMoving = true;
        profileMoveFrame = window.requestAnimationFrame(() => {
            profileMoveFrame = 0;
            setProfileImageRect(profileDestination);
        });
    };

    profileImage.addEventListener("transitionend", (event) => {
        if (
            !profileImageMoving ||
            !["top", "left", "width", "height"].includes(event.propertyName)
        ) {
            return;
        }

        const rect = profileImage.getBoundingClientRect();
        const destination = profileDestination;
        if (
            Math.abs(rect.left - destination.left) < 1 &&
            Math.abs(rect.top - destination.top) < 1 &&
            Math.abs(rect.width - destination.width) < 1 &&
            Math.abs(rect.height - destination.height) < 1
        ) {
            finishProfileImageMove();
        }
    });

    const updateProfileImagePosition = () => {
        if (profileImageAtHome ? window.scrollY < 32 : window.scrollY > 80) {
            moveProfileImage(!profileImageAtHome, !reduceMotion);
        }
    };

    window.addEventListener("scroll", updateProfileImagePosition, {
        passive: true,
    });
    window.addEventListener("resize", () => {
        if (profileImageAtHome || profileImageMoving) {
            moveProfileImage(profileImageAtHome, !reduceMotion);
        }
    });
    if (window.scrollY > 80) {
        moveProfileImage(true, !reduceMotion);
    }

    const revealItems = document.querySelectorAll(".reveal");

    document.documentElement.classList.add("js-enabled");

    if (reduceMotion || !("IntersectionObserver" in window)) {
        revealItems.forEach((item) => item.classList.add("is-visible"));
    } else {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12 },
        );

        revealItems.forEach((item) => observer.observe(item));
    }

    const kaliContainer = document.querySelector(".kali-container");
    const kaliEyeTargets = Array.from(
        document.querySelectorAll(".kali-eye"),
        (eye) => ({
            eye,
            iris: eye.querySelector(".kali-iris"),
            currentX: 0,
            currentY: 0,
            targetX: 0,
            targetY: 0,
        }),
    ).filter(({ iris }) => iris);
    const canTrackPointer = window.matchMedia(
        "(hover: hover) and (pointer: fine)",
    ).matches;

    if (kaliContainer && kaliEyeTargets.length && canTrackPointer) {
        let animationFrame = 0;

        window.addEventListener(
            "pointermove",
            (event) => {
                const bounds = kaliContainer.getBoundingClientRect();
                if (!bounds.width || !bounds.height) {
                    return;
                }

                kaliEyeTargets.forEach((target) => {
                    const eyeBounds = target.eye.getBoundingClientRect();
                    if (!eyeBounds.width || !eyeBounds.height) {
                        return;
                    }

                    const horizontal =
                        (event.clientX - (eyeBounds.left + eyeBounds.width / 2)) /
                        (bounds.width * 0.25);
                    const vertical =
                        (event.clientY - (eyeBounds.top + eyeBounds.height / 2)) /
                        (bounds.height * 0.12);
                    const horizontalLimit = Math.max(
                        0,
                        (eyeBounds.width - target.iris.offsetWidth) / 2 - 0.5,
                    );
                    const verticalLimit = Math.max(
                        0,
                        (eyeBounds.height - target.iris.offsetHeight) / 2 - 0.5,
                    );

                    target.targetX =
                        Math.max(-1, Math.min(1, horizontal)) *
                        Math.min(eyeBounds.width * 0.07, horizontalLimit);
                    target.targetY =
                        Math.max(-1, Math.min(1, vertical)) *
                        Math.min(eyeBounds.height * 0.1, verticalLimit);
                });

                if (!animationFrame) {
                    const animatePupils = () => {
                        kaliEyeTargets.forEach((target) => {
                            target.currentX +=
                                (target.targetX - target.currentX) * 0.14;
                            target.currentY +=
                                (target.targetY - target.currentY) * 0.14;
                            target.iris.style.setProperty(
                                "--pupil-x",
                                `${target.currentX}px`,
                            );
                            target.iris.style.setProperty(
                                "--pupil-y",
                                `${target.currentY}px`,
                            );
                        });

                        const stillMoving = kaliEyeTargets.some(
                            ({ currentX, currentY, targetX, targetY }) =>
                                Math.abs(targetX - currentX) > 0.01 ||
                                Math.abs(targetY - currentY) > 0.01,
                        );
                        if (stillMoving) {
                            animationFrame =
                                window.requestAnimationFrame(animatePupils);
                        } else {
                            animationFrame = 0;
                        }
                    };

                    animationFrame = window.requestAnimationFrame(animatePupils);
                }
            },
            { passive: true },
        );
    }
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePage, { once: true });
} else {
    initializePage();
}

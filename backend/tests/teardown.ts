import fs from "fs";
import Docker from "dockerode";


module.exports = async function () {

    if (!fs.existsSync(".containerId")) return;

    const containerId = fs.readFileSync(".containerId", "utf-8").trim();
    const docker = new Docker();
    const container = docker.getContainer(containerId);

    try {
        await container.stop();
        await container.remove();
        console.log(`Container ${containerId} stopped and removed.`);
    } catch (err) {
        console.warn(`Error stopping/removing container ${containerId}:`, err);
    }

    if (fs.existsSync(".containerId")) fs.unlinkSync(".containerId");
    if (fs.existsSync(".testenv")) fs.unlinkSync(".testenv");
};

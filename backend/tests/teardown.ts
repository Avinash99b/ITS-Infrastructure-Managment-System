import fs from "fs";
import Docker from "dockerode";

module.exports=async function () {
    const containerId = fs.readFileSync(".containerId", "utf-8");
    const docker = new Docker();
    const container = docker.getContainer(containerId);
    await container.stop();
    await container.remove();

    fs.unlinkSync(".containerId");
    fs.unlinkSync(".testenv");
}
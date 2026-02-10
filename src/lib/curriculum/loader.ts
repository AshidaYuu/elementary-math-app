
import { Curriculum } from "@/types/curriculum";
import addData from "@/curriculum/es_g1_add.json";
import subData from "@/curriculum/es_g1_sub.json";
import mulData from "@/curriculum/es_g2_mul.json";
import writtenAddData from "@/curriculum/es_g2_add_written.json";

// Map of available curricula
const curriculaMap: Record<string, unknown> = {
    "ES_G1_ADD": addData,
    "ES_G1_SUB": subData,
    "ES_G2_MUL": mulData,
    "ES_G2_ADD_WRITTEN": writtenAddData
};

// For MVP, import direct JSON. In future, fetch from API or FS.
export async function loadCurriculum(trackId: string): Promise<Curriculum> {
    // Simulator async load
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const data = curriculaMap[trackId];
            if (data) {
                resolve(data as unknown as Curriculum);
            } else {
                reject(new Error(`Curriculum not found: ${trackId}`));
            }
        }, 100);
    });
}

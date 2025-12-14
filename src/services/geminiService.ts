import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { AnalysisResult, Task, MeetingLog, InsightReport } from '../types';
import { v4 as uuidv4 } from 'uuid';

const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
  console.error("API Key가 없습니다. .env 파일을 확인해주세요.");
  throw new Error("API Key가 설정되지 않았습니다.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

const MODEL_NAME = "gemini-2.5-flash"; 

// 1. 회의 분석용 스키마 (Description 유지 + SchemaType 적용)
const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: {
      type: SchemaType.STRING,
      description: "대화 내용을 2-3 문장으로 간결하고 중립적으로 요약합니다."
    },
    tasks: {
      type: SchemaType.ARRAY,
      description: "텍스트에서 실행 가능한 할 일 목록입니다.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          description: {
            type: SchemaType.STRING,
            description: "완료해야 할 구체적인 실행 항목 또는 작업입니다."
          },
          assignee: {
            type: SchemaType.STRING,
            description: "작업을 수행할 담당자의 실제 이름(예: 김철수, 이영희)입니다. '담당자1'과 같은 모호한 표현은 쓰지 마세요. 문맥상 본인(사용자, 화자)이 해야 할 일이면 '나'라고 적으세요."
          },
          priority: {
            type: SchemaType.STRING,
            description: "작업의 우선순위. 'High', 'Medium', 'Low' 중 하나로 분류됩니다."
          },
          department: {
            type: SchemaType.STRING,
            description: "작업이 속한 부서 또는 파트입니다. (예: 개발, 디자인, 기획). 명확하지 않으면 '공통'으로 지정하세요."
          },
          deadline: {
            type: SchemaType.STRING,
            description: "작업의 마감 기한입니다. 반드시 'YYYY-MM-DD' 또는 'YYYY-MM-DD HH:mm' 형식으로 변환하세요. '내일', '오늘 저녁' 등의 상대적 날짜는 현재 시각 기준으로 계산하여 절대적인 날짜로 기입해야 합니다. 기한이 없으면 '기한 없음'을 사용하세요."
          }
        },
        required: ["description", "assignee", "priority", "department", "deadline"]
      }
    },
    decisions: {
      type: SchemaType.ARRAY,
      description: "대화 중 내려진 주요 결정 사항 목록입니다.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          description: {
            type: SchemaType.STRING,
            description: "내려진 결정에 대한 명확한 설명입니다."
          }
        },
        required: ["description"]
      }
    }
  },
  required: ["summary", "tasks", "decisions"]
};

// 2. 팀 인사이트용 스키마 (Description 유지 + SchemaType 적용)
const insightSchema = {
  type: SchemaType.OBJECT,
  properties: {
    items: {
      type: SchemaType.ARRAY,
      description: "프로젝트의 돌이킬 수 없는 중요한 결정 5~7가지 목록",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING, description: "결정 주제 (예: 기술 스택 변경)" },
          decision: { type: SchemaType.STRING, description: "최종 결정 내용" },
          rationale: { type: SchemaType.STRING, description: "결정의 이유 및 배경" },
          controversy: { type: SchemaType.STRING, description: "당시 치열했던 논의 쟁점 및 반대 의견 요약" },
          impact: { type: SchemaType.STRING, description: "중요도", enum: ["Critical", "Major"] }
        },
        required: ["title", "decision", "rationale", "controversy", "impact"]
      }
    }
  },
  required: ["items"]
};

// 기능 1: 개별 회의록 분석
export async function analyzeContent(content: string, mimeType?: string, teamMembers?: string[]): Promise<AnalysisResult> {
  const now = new Date();
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const currentDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} (${days[now.getDay()]}요일)`;

  const teamInfo = teamMembers && teamMembers.length > 0 
    ? `현재 팀 멤버 목록: [${teamMembers.join(', ')}].` 
    : "";

  // ✅ 상세한 시스템 프롬프트 적용
  const systemInstruction = `
    당신은 Clippy라는 이름의 전문 회의 비서입니다. 제공된 회의록(텍스트 또는 오디오)을 분석해 주세요.
    당신의 임무는 요약, 실행 항목(할 일), 그리고 주요 결정 사항을 추출하는 것입니다.
    
    기준 현재 시각: ${currentDateTime}
    ${teamInfo}
    
    가이드라인:
    1.  **요약**: 대화의 주요 내용을 간결하고 중립적으로 요약해 주세요.
    2.  **할 일**: 명확하고 실행 가능한 항목을 식별하세요. 각 할 일에 대해 설명, 담당자, 우선순위(High, Medium, Low), 소속 부서, 그리고 마감 기한을 결정하세요. 
        - **담당자 지정**: '담당자1', '직원A' 같은 임의의 호칭은 절대 사용하지 마세요. 대화에서 식별된 실명(예: 김민수, 박지민)을 정확히 기입하세요. 
        ${teamMembers ? "- **중요**: 위 제공된 '현재 팀 멤버 목록'에 있는 이름이 대화에서 식별된다면, 해당 멤버의 이름을 정확히 사용하여 담당자를 지정하세요." : ""}
        - 화자가 '제가 하겠습니다'라고 한 경우 해당 화자의 이름을 사용하고, 화자가 불분명하거나 개인 메모인 경우 '나'로 표기하세요. 담당자가 없으면 '미지정', 부서가 불명확하면 '공통'으로 표시하세요.
    3.  **마감 기한 (중요)**: '내일', '오늘 저녁', '다음주 화요일'과 같은 상대적인 시간 표현은 **반드시 위 '기준 현재 시각'을 바탕으로 구체적인 날짜('YYYY-MM-DD') 또는 시간 포함 날짜('YYYY-MM-DD HH:mm') 형식으로 변환**해야 합니다. 캘린더에 등록할 수 있도록 정확한 날짜를 계산하세요. 기한이 없으면 '기한 없음'으로 표시하세요.
    4.  **결정 사항**: 도달한 명시적인 결론이나 합의 사항을 정확히 찾아내세요.
    
    결과는 제공된 JSON 스키마에 따라 엄격하게 반환해 주세요. 추가적인 텍스트나 설명은 포함하지 마세요.
  `;

  // ✅ 모델 초기화 시 systemInstruction 주입
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: systemInstruction,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: responseSchema as any,
    }
  });

  let parts: any[] = [];
  if (mimeType && mimeType.startsWith('audio/')) {
      // Audio Input
      parts = [
          { text: "다음 오디오 파일을 분석하여 요약, 할 일, 결정 사항을 추출해 주세요." },
          {
              inlineData: {
                  mimeType: mimeType,
                  data: content // Base64 string
              }
          }
      ];
  } else {
      // Text Input
      parts = [
          { text: `다음 텍스트를 분석해 주세요:\n\n---\n${content}\n---` }
      ];
  }

  try {
    const result = await model.generateContent(parts);
    const response = await result.response;
    const jsonText = response.text();
    const parsedResult = JSON.parse(jsonText);

    // Add unique IDs and completed status to tasks
    const tasksWithIds: Task[] = parsedResult.tasks.map((task: any) => ({
      ...task,
      id: uuidv4(),
      completed: false
    }));
    
    const decisionsWithIds = parsedResult.decisions.map((decision: any) => ({
      ...decision,
      id: uuidv4(),
    }));

    return {
        summary: parsedResult.summary,
        tasks: tasksWithIds,
        decisions: decisionsWithIds,
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("분석에 실패했습니다. API 키와 네트워크 상태를 확인해주세요.");
  }
}

// 기능 2: 팀 인사이트 생성
export async function generateTeamInsights(history: MeetingLog[]): Promise<InsightReport> {
    if (history.length === 0) {
        return { generatedAt: new Date().toISOString(), items: [] };
    }

    const historyText = history.map((log, index) => `
    [회의 #${index + 1}] 날짜: ${log.date} | 파일명: ${log.fileName}
    요약: ${log.summary}
    결정사항: ${log.decisions.map(d => `- ${d.description}`).join(' ')}
    `).join('\n\n');

    const systemInstruction = `
        당신은 프로젝트 관리 전문가입니다. 아래 제공된 ${history.length}건의 회의 기록들을 종합 분석하여 프로젝트의 흐름을 파악하세요.
        
        **임무:**
        초기 설계 결정, 기술 스택 변경, 방향 전환 등 프로젝트의 운명을 바꾼 **'돌이킬 수 없는 중요한 결정' 5~7가지**를 선정하여 정리하세요.
        각 항목마다 결정 내용, 이유, 그리고 당시의 **쟁점 및 반대 의견(Controversy)**을 상세히 기술하세요.
    `;

    // ✅ 여기도 모델 초기화 시 systemInstruction 주입
    const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        systemInstruction: systemInstruction,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: insightSchema as any,
        }
    });

    try {
        const result = await model.generateContent([{ text: `다음 회의 기록을 바탕으로 리포트를 작성해 주세요:\n\n${historyText}` }]);
        const response = await result.response;
        const jsonText = response.text();
        const parsed = JSON.parse(jsonText);
        
        return {
            generatedAt: new Date().toISOString(),
            items: parsed.items
        };
    } catch (error) {
        console.error("Insight Error:", error);
        throw new Error("인사이트 생성 중 오류가 발생했습니다.");
    }
}
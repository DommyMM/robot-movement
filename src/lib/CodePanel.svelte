<script lang="ts">
    import type { Command, LoopCommand } from '$lib/commands';
    import { darkMode } from '$lib/theme';
    
    export let programBlocks: string[] = [];
    export let getCommandById: (id: string) => Command | undefined;
    
    let selectedLanguage = 'python';

    function getCommand(command: Command, language: string): string {
        const isStaticTyped = language === 'cpp' || language === 'java';
        const commandSuffix = isStaticTyped ? '();' : '()';
        const unknownComment = isStaticTyped ? '// Unknown command' : '# Unknown command';
        switch (command.id) {
            case 'moveForward': return `front${commandSuffix}`;
            case 'moveBack': return `back${commandSuffix}`;
            case 'turnRight': return `right${commandSuffix}`;
            case 'turnLeft': return `left${commandSuffix}`;
            default: return unknownComment;
        }
    }

    function generateCode(blocks: string[]): string {
        let code = '';
        let indentLevel = 1;
        
        function getIndent(level: number): string {
            return "    ".repeat(level);
        }

        switch (selectedLanguage) {
            case 'python':
                code = "def commands():\n";
                break;
            case 'cpp':
                code = "void commands() {\n";
                break;
            case 'java':
                code = "public class Robot {\n    public void commands() {\n";
                indentLevel = 2;
                break;
        }
        
        for (const blockId of blocks) {
            const command = getCommandById(blockId);
            if (!command) continue;
            
            if (command.type === 'loop') {
                const loopCmd = command as LoopCommand;
                if (selectedLanguage === 'python') {
                    code += `${getIndent(indentLevel)}for x in range(${loopCmd.repeats}):\n`;
                } else {
                    code += `${getIndent(indentLevel)}for(int i = 0; i < ${loopCmd.repeats}; i++) {\n`;
                }
                indentLevel++;
                
                if (loopCmd.children && loopCmd.children.length > 0) {
                    for (const childId of loopCmd.children) {
                        const childCmd = getCommandById(childId);
                        if (childCmd) {
                            code += `${getIndent(indentLevel)}${getCommand(childCmd, selectedLanguage)}\n`;
                        }
                    }
                } else {
                    code += selectedLanguage === 'python' 
                        ? `${getIndent(indentLevel)}pass  # Empty loop\n`
                        : `${getIndent(indentLevel)}// Empty loop\n`;
                }
                indentLevel--;
                if (selectedLanguage === 'cpp' || selectedLanguage === 'java') code += `${getIndent(indentLevel)}}\n`;
            } else {
                code += `${getIndent(indentLevel)}${getCommand(command, selectedLanguage)}\n`;
            }
        }
        
        if (blocks.length === 0) {
            const comment = selectedLanguage === 'python' ? 
                `${getIndent(1)}pass  # No commands added yet\n` :
                `${getIndent(selectedLanguage === 'java' ? 2 : 1)}// No commands added yet\n`;
            code += comment;
        }
        
        if (selectedLanguage === 'cpp') code += "}\n";
        if (selectedLanguage === 'java') code += "    }\n}\n";
        
        return code.trim();
    }

    function generateExplanation(blocks: string[]): string[] {
        let explanations: string[] = [];
        
        for (const blockId of blocks) {
            const command = getCommandById(blockId);
            if (!command) continue;
            
            if (command.type === 'loop') {
                const loopCmd = command as LoopCommand;
                explanations.push(`Repeat x${loopCmd.repeats}: {`);
                if (loopCmd.children.length > 0) {
                    explanations.push(...generateExplanation(loopCmd.children).map(exp => `  ${exp}`));
                }
                explanations.push('}');
            } else {
                switch (command.id) {
                    case 'moveForward':
                        explanations.push('direction.move(+1)');
                        break;
                    case 'moveBack':
                        explanations.push('direction.move(-1)');
                        break;
                    case 'turnRight':
                        explanations.push('rotation += 90°');
                        break;
                    case 'turnLeft':
                        explanations.push('rotation -= 90°');
                        break;
                }
            }
        }
        return explanations;
    }
</script>

<div class={`p-6 rounded-lg shadow-lg transition-all duration-200 ${$darkMode ? 'bg-gray-800' : 'bg-white'}`}>
    <div class="flex justify-between items-center mb-4">
        <h2 class={`text-xl font-semibold ${$darkMode ? 'text-white' : 'text-black'}`}>
            {selectedLanguage === 'python' ? 'Python' : selectedLanguage === 'cpp' ? 'C++' : 'Java'} Code
        </h2>
        <select
            bind:value={selectedLanguage}
            class={`px-3 py-1 rounded-lg ${$darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'}`}
        >
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
        </select>
    </div>
    <div class="grid grid-cols-2 gap-4">
        <pre class={`font-mono text-sm p-4 rounded-lg h-[155px] overflow-auto ${$darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-800'}`}>{generateCode(programBlocks)}</pre>
        <div class={`text-sm p-4 rounded-lg h-[155px] overflow-auto ${$darkMode ? 'bg-gray-900 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
            {#each generateExplanation(programBlocks) as explanation}
                <div class="mb-2">{explanation}</div>
            {/each}
            {#if programBlocks.length === 0}
                <div class="italic">Add blocks to see explanations</div>
            {/if}
        </div>
    </div>
</div>
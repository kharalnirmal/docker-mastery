/* Original explanatory diagrams. Only repository-authored HTML is used here. */
(() => {
  function guide({ lesson, id, title, analogy, technical, steps, exercise, reference }) {
    const entry = window.LESSONS.find(item => item.id === lesson);
    if (!entry) throw new Error(`Missing visual-guide lesson: ${lesson}`);
    const image = `assets/images/guides/${id}.svg`;
    const html = `<h2 id="${id}">${title}</h2>
      <p><strong>Real-life analogy:</strong> ${analogy}</p>
      <p>${technical}</p>
      <figure><img src="${image}" alt="${steps.join(' → ')}" loading="lazy" width="640" height="360"><figcaption>${title}. <a href="${image}">Open full-size diagram</a>.</figcaption></figure>
      <p><strong>Workflow, also available as text:</strong></p><ol>${steps.map(step => `<li>${step}</li>`).join('')}</ol>
      <p><strong>Try explaining it:</strong> ${exercise} This reasoning exercise creates no resources and needs no cleanup.</p>
      <p>Primary reference: <a href="${reference}">${title}</a>. This diagram is a teaching model, not a production guarantee.</p>`;
    entry.html = entry.html.includes('<h2 id="cleanup"') ? entry.html.replace('<h2 id="cleanup"', html + '<h2 id="cleanup"') : entry.html + html;
    entry.keywords += ` ${title} ${id}`;
    entry.minutes += 5;
  }
  guide({
    lesson: 'first-container', id: 'shared-kernel', title: 'Processes, not tiny virtual machines',
    analogy: 'Two shops in one building have separate rooms and stock, but share the building infrastructure. Separate rooms do not make two separate buildings.',
    technical: 'Linux containers isolate process views, filesystems and networking through kernel facilities such as namespaces. Resource controls use cgroups. They still share the relevant Linux kernel: a container does not boot its own kernel. On Windows/macOS, the Linux engine normally runs in a Linux environment or VM. Isolation is useful but is not an unlimited security boundary; mounting the daemon socket or host files can undo it.',
    steps: ['Choose an image with its application and user-space files.', 'The engine starts isolated application processes.', 'Those processes call the shared Linux kernel.', 'On Desktop, that kernel belongs to the Linux environment, not the host Windows kernel.'],
    exercise: 'Why can an ordinary Linux image not provide a Windows kernel? Identify what a kernel vulnerability could affect across the shared boundary.',
    reference: 'https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/'
  });
  // More guides can be added here.
})();

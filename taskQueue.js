module.exports = {
  asyncQueue: (concurrency = 1) => {
    let running = 0;
    const taskQueue = [];
    const afterTaskQueue = [];

    const runTask = (task) => {
      running++;
      task(() => {
        running--;
        if (taskQueue.length > 0) {
          runTask(taskQueue.shift());
        } else if (running == 0 && afterTaskQueue.length > 0) {
          runTask(afterTaskQueue.shift());
        }
      });
    };

    const enqueueTask = (task) => taskQueue.push(task);

    return {
      push: (task) => {
        running < concurrency ? runTask(task) : enqueueTask(task);
      },
      pushAfter: (task) => {
        afterTaskQueue.push(task);
      },
    };
  },
};

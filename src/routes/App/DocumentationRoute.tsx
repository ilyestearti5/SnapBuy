import { memo, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  Translate,
  Button,
  Scroll,
  CircleTip,
  EmptyComponent,
  Icon,
  Field,
  Line,
} from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";
import { tw } from "@biqpod/app/ui/utils";
import { AnimatedPage } from "../../animations/components";
import {
  closePopup,
  getFieldValue,
  setFieldValue,
  showPopup,
} from "@biqpod/app/ui/hooks";
import {
  categories,
  Category,
  Feature,
  features,
  Task,
  tasks,
} from "./categories";
// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};
const cardVariants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
    },
  },
  hover: {
    y: -5,
    scale: 1.02,
    transition: {
      duration: 0.2,
    },
  },
};
const sectionVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4 },
  },
};
const FeatureCard = memo(({ feature }: { feature: Feature }) => {
  const category = categories.find((cat) => cat.id === feature.category);
  return (
    <motion.div variants={cardVariants} whileHover="hover" className="relative">
      <Card className="relative h-full overflow-hidden cursor-pointer">
        <div className="flex flex-col p-4 h-full">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="bg-[--biqpod-gray-opacity] p-2 rounded-lg">
              <div className="text-[--biqpod-primary] text-lg">
                <Icon icon={feature.icon} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm truncate">
                  <Translate content={feature.name} />
                </h3>
                {feature.isNew && (
                  <span className="bg-[--biqpod-primary] px-2 py-0.5 rounded-full text-[--biqpod-primary-content] text-xs">
                    <Translate content="new" />
                  </span>
                )}
                {feature.isPro && (
                  <span className="bg-[--biqpod-primary] px-2 py-0.5 rounded-full text-[--biqpod-primary-content] text-xs">
                    <Translate content="pro" />
                  </span>
                )}
              </div>
              <p className="text-[--biqpod-text-secondary] text-xs line-clamp-2">
                <Translate content={feature.description} />
              </p>
            </div>
          </div>
          {/* Tips count */}
          <div className="flex justify-between items-center mt-auto">
            <span className="text-[--biqpod-text-secondary] text-xs">
              {feature.tips.length} <Translate content="tips available" />
            </span>
            <Button
              className="px-3 py-1 w-fit text-xs"
              onClick={() => {
                showPopup(<FeatureDetails feature={feature} />);
              }}
            >
              <Translate content="view tips" />
            </Button>
          </div>
        </div>
        {/* Category indicator */}
        <div
          className={tw(
            "absolute top-2 right-2 w-3 h-3 rounded-full",
            category?.color?.replace("text-", "bg-")
          )}
        />
      </Card>
    </motion.div>
  );
});
const CategoryFilter = memo(
  ({
    categories,
    activeCategories,
    onCategorySelect,
  }: {
    categories: Category[];
    activeCategories: string[];
    onCategorySelect: (id: string) => void;
  }) => {
    return (
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          icon={allIcons.solid.faList}
          className={tw(
            "text-sm px-4 py-2 w-fit rounded-full transition-all",
            activeCategories.length === 0
              ? "bg-[--biqpod-primary] text-[--biqpod-primary-content]"
              : "bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
          )}
          onClick={() => onCategorySelect("")}
        >
          <Translate content="all" />
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            className={tw(
              "text-sm px-4 py-2 w-fit rounded-full transition-all flex items-center gap-2",
              activeCategories.includes(category.id)
                ? "bg-[--biqpod-primary] text-[--biqpod-primary-content]"
                : "bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
            )}
            onClick={() => onCategorySelect(category.id)}
          >
            <div className="text-xs">
              <Icon icon={category.icon} />
            </div>
            <Translate content={category.name} />
          </Button>
        ))}
      </div>
    );
  }
);
const FeatureDetails = memo(({ feature }: { feature: Feature }) => {
  const category = categories.find((cat) => cat.id === feature.category);
  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-6 border-[--biqpod-borders] border-b">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-4">
            <div className="bg-[--biqpod-gray-opacity] p-3 rounded-xl">
              <div className="text-[--biqpod-primary] text-2xl">
                <Icon icon={feature.icon} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="font-bold text-2xl">
                  <Translate content={feature.name} />
                </h2>
                {feature.isNew && (
                  <span className="bg-[--biqpod-primary] px-3 py-1 rounded-full text-[--biqpod-primary-content] text-sm">
                    <Translate content="new" />
                  </span>
                )}
                {feature.isPro && (
                  <span className="bg-[--biqpod-primary] px-3 py-1 rounded-full text-[--biqpod-primary-content] text-sm">
                    <Translate content="pro" />
                  </span>
                )}
              </div>
              <p className="mb-2 text-[--biqpod-text-secondary]">
                <Translate content={feature.description} />
              </p>
              <div className="flex items-center gap-2 text-sm">
                <div className="text-[--biqpod-primary] text-sm">
                  <Icon icon={category?.icon || allIcons.solid.faStore} />
                </div>
                <span className="text-[--biqpod-text-secondary]">
                  <Translate content={category?.name || ""} />
                </span>
              </div>
            </div>
          </div>
          <CircleTip
            icon={allIcons.solid.faTimes}
            className="text-[--biqpod-text-secondary]"
          />
        </div>
      </div>
      {/* Content */}
      <Scroll className="max-h-[60vh]">
        <div className="p-6">
          <h3 className="flex items-center gap-2 mb-4 font-semibold text-lg">
            <div className="text-[--biqpod-primary]">
              <Icon icon={allIcons.solid.faLightbulb} />
            </div>
            <Translate content="tips & best practices" />
          </h3>
          <div className="space-y-3">
            {feature.tips.map((tip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 bg-[--biqpod-gray-opacity] p-3 rounded-lg"
              >
                <div className="flex flex-shrink-0 justify-center items-center bg-[--biqpod-primary] rounded-full w-6 h-6 font-semibold text-[--biqpod-primary-content] text-sm">
                  {index + 1}
                </div>
                <p className="text-sm leading-relaxed">
                  <Translate content={tip} />
                </p>
              </motion.div>
            ))}
          </div>
          {feature.route && (
            <div className="bg-[--biqpod-gray-opacity] mt-6 p-4 border border-[--biqpod-borders] rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="mb-1 font-semibold text-[--biqpod-text-color]">
                    <Translate content="explore this feature" />
                  </h4>
                  <p className="text-[--biqpod-text-secondary] text-sm">
                    <Translate content="visit the dedicated page to use this feature" />
                  </p>
                </div>
                <Button
                  className="w-fit"
                  onClick={() => {
                    window.location.href = feature.route!;
                  }}
                >
                  <Translate content="go to feature" />
                  <div className="ml-2">
                    <Icon icon={allIcons.solid.faArrowRight} />
                  </div>
                </Button>
              </div>
            </div>
          )}
        </div>
      </Scroll>
    </Card>
  );
});
export const DocumentationRoute = () => {
  const searchQuery = getFieldValue("search-in-doc");
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const filteredFeatures = useMemo(() => {
    let filtered = features;
    // Filter by categories
    if (activeCategories.length > 0) {
      filtered = filtered.filter((feature) =>
        activeCategories.includes(feature.category)
      );
    }
    // Filter by search query
    if (searchQuery?.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (feature) =>
          feature.name.toLowerCase().includes(query) ||
          feature.description.toLowerCase().includes(query) ||
          feature.tips.some((tip) => tip.toLowerCase().includes(query))
      );
    }
    return filtered;
  }, [activeCategories, searchQuery]);
  const featuresByCategory = useMemo(() => {
    return categories.map((category) => ({
      ...category,
      features: features.filter((feature) => feature.category === category.id),
      count: features.filter((feature) => feature.category === category.id)
        .length,
    }));
  }, []);
  return (
    <AnimatedPage>
      <motion.div
        className="w-full h-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Scroll className="w-full h-full">
          <div className="mx-auto p-6 max-w-7xl">
            {/* Header */}
            <motion.div variants={sectionVariants} className="mb-8 text-center">
              <div className="flex justify-center items-center gap-3 mb-4">
                <div className="text-[--biqpod-primary] text-4xl">
                  <Icon icon={allIcons.solid.faBook} />
                </div>
                <h1 className="font-bold text-4xl">
                  <Translate content="Snapbuy Documentation" />
                </h1>
              </div>
              <p className="mx-auto max-w-3xl text-[--biqpod-text-secondary] text-lg">
                <Translate content="Discover all features, tips, and best practices to maximize your e-commerce success with Snapbuy" />
              </p>
            </motion.div>
            {/* Stats */}
            <motion.div
              variants={sectionVariants}
              className="gap-4 grid grid-cols-2 md:grid-cols-4 mb-8"
            >
              <Card className="p-4 text-center">
                <div className="font-bold text-[--biqpod-primary] text-2xl">
                  {features.length}
                </div>
                <div className="text-[--biqpod-text-secondary] text-sm">
                  <Translate content="features" />
                </div>
              </Card>
              <Card className="p-4 text-center">
                <div className="font-bold text-[--biqpod-primary] text-2xl">
                  {features.reduce((acc, f) => acc + f.tips.length, 0)}
                </div>
                <div className="text-[--biqpod-text-secondary] text-sm">
                  <Translate content="tips" />
                </div>
              </Card>
              <Card className="p-4 text-center">
                <div className="font-bold text-[--biqpod-primary] text-2xl">
                  {features.filter((f) => f.isNew).length}
                </div>
                <div className="text-[--biqpod-text-secondary] text-sm">
                  <Translate content="new features" />
                </div>
              </Card>
              <Card className="p-4 text-center">
                <div className="font-bold text-[--biqpod-primary] text-2xl">
                  {categories.length}
                </div>
                <div className="text-[--biqpod-text-secondary] text-sm">
                  <Translate content="categories" />
                </div>
              </Card>
            </motion.div>
            {/* Popular Tasks */}
            <motion.div variants={sectionVariants} className="mb-8">
              <div className="flex justify-center items-center gap-3 mb-6">
                <div className="text-[--biqpod-primary] text-3xl">
                  <Icon icon={allIcons.solid.faTasks} />
                </div>
                <h2 className="font-bold text-3xl">
                  <Translate content="Popular Tasks" />
                </h2>
              </div>
              <p className="mx-auto mb-6 max-w-3xl text-[--biqpod-text-secondary] text-center">
                <Translate content="Step-by-step guides to help you get started and master Snapbuy's powerful features" />
              </p>
              <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </motion.div>
            {/* Search */}
            <motion.div variants={sectionVariants} className="mb-6">
              <div className="mx-auto max-w-md">
                <Field
                  inputName="search-in-doc"
                  className="p-2 rounded-2xl"
                  placeholder="Search features, tips, and documentation..."
                />
              </div>
            </motion.div>
            {/* Category Filter */}
            <motion.div variants={sectionVariants}>
              <CategoryFilter
                categories={categories}
                activeCategories={activeCategories}
                onCategorySelect={(id) => {
                  if (id === "") {
                    // Clear all categories
                    setActiveCategories([]);
                  } else {
                    // Toggle category
                    setActiveCategories((prev) =>
                      prev.includes(id)
                        ? prev.filter((cat) => cat !== id)
                        : [...prev, id]
                    );
                  }
                }}
              />
            </motion.div>
            {/* Category Overview (when no filter) */}
            {activeCategories.length === 0 && !searchQuery && (
              <motion.div variants={sectionVariants} className="mb-8">
                <h2 className="mb-6 font-bold text-2xl text-center">
                  <Translate content="feature categories" />
                </h2>
                <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {featuresByCategory.map((category) => (
                    <motion.div
                      key={category.id}
                      variants={cardVariants}
                      whileHover="hover"
                    >
                      <Card
                        className="p-6 cursor-pointer"
                        onClick={() => setActiveCategories([category.id])}
                      >
                        <div className="flex items-start gap-4">
                          <div className="bg-[--biqpod-gray-opacity] p-3 rounded-xl">
                            <div className="text-[--biqpod-primary] text-2xl">
                              <Icon icon={category.icon} />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="mb-2 font-semibold text-lg">
                              <Translate content={category.name} />
                            </h3>
                            <p className="mb-3 text-[--biqpod-text-secondary] text-sm">
                              <Translate content={category.description} />
                            </p>
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-[--biqpod-primary] text-sm">
                                {category.count}{" "}
                                <Translate content="features" />
                              </span>
                              <div className="text-[--biqpod-text-secondary]">
                                <Icon icon={allIcons.solid.faArrowRight} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
            {/* Features Grid */}
            {(activeCategories.length > 0 || searchQuery) && (
              <motion.div variants={sectionVariants}>
                {filteredFeatures.length > 0 ? (
                  <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredFeatures.map((feature) => (
                      <FeatureCard key={feature.id} feature={feature} />
                    ))}
                  </div>
                ) : (
                  <EmptyComponent>
                    <Card className="p-8 text-center">
                      <div className="mb-4 text-[--biqpod-text-secondary] text-4xl">
                        <Icon icon={allIcons.solid.faSearch} />
                      </div>
                      <h3 className="mb-2 font-semibold text-lg">
                        <Translate content="no features found" />
                      </h3>
                      <p className="mb-4 text-[--biqpod-text-secondary]">
                        <Translate content="try adjusting your search or category filter" />
                      </p>
                      <Button
                        onClick={() => {
                          setActiveCategories([]);
                          setFieldValue("search-in-doc", "");
                        }}
                      >
                        <Translate content="clear filters" />
                      </Button>
                    </Card>
                  </EmptyComponent>
                )}
              </motion.div>
            )}
          </div>
        </Scroll>
      </motion.div>
    </AnimatedPage>
  );
};
const TaskCard = memo(({ task }: { task: Task }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "text-[--biqpod-primary] bg-[--biqpod-gray-opacity]";
      case "intermediate":
        return "text-[--biqpod-primary] bg-[--biqpod-gray-opacity]";
      case "advanced":
        return "text-[--biqpod-primary] bg-[--biqpod-gray-opacity]";
      default:
        return "text-[--biqpod-primary] bg-[--biqpod-gray-opacity]";
    }
  };
  return (
    <motion.div variants={cardVariants} whileHover="hover" className="relative">
      <Card className="relative h-full overflow-hidden cursor-pointer">
        <div className="flex flex-col p-4 h-full">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="bg-[--biqpod-gray-opacity] p-2 rounded-lg">
              <div className="text-[--biqpod-primary] text-lg">
                <Icon icon={task.icon} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm truncate">
                  <Translate content={task.title} />
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${getDifficultyColor(
                    task.difficulty
                  )}`}
                >
                  <Translate content={task.difficulty} />
                </span>
              </div>
              <p className="text-[--biqpod-text-secondary] text-xs line-clamp-2">
                <Translate content={task.description} />
              </p>
            </div>
          </div>
          {/* Task info */}
          <div className="flex justify-between items-center mt-auto">
            <div className="flex items-center gap-2 text-[--biqpod-text-secondary] text-xs">
              <Icon icon={allIcons.solid.faClock} />
              <span>{task.estimatedTime}</span>
            </div>
            <Button
              className="px-3 py-1 w-fit text-xs"
              onClick={() => {
                showPopup(<TaskDetails task={task} />);
              }}
            >
              <Translate content="view guide" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
});
const TaskDetails = memo(({ task }: { task: Task }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "text-[--biqpod-primary] bg-[--biqpod-gray-opacity]";
      case "intermediate":
        return "text-[--biqpod-primary] bg-[--biqpod-gray-opacity]";
      case "advanced":
        return "text-[--biqpod-primary] bg-[--biqpod-gray-opacity]";
      default:
        return "text-[--biqpod-primary] bg-[--biqpod-gray-opacity]";
    }
  };
  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-6 border-[--biqpod-borders] border-b">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-4">
            <div className="bg-[--biqpod-gray-opacity] p-3 rounded-xl">
              <div className="text-[--biqpod-primary] text-2xl">
                <Icon icon={task.icon} />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="font-bold text-2xl">
                  <Translate content={task.title} />
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${getDifficultyColor(
                    task.difficulty
                  )}`}
                >
                  <Translate content={task.difficulty} />
                </span>
              </div>
              <p className="mb-2 text-[--biqpod-text-secondary]">
                <Translate content={task.description} />
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-[--biqpod-text-secondary]">
                  <Icon icon={allIcons.solid.faClock} />
                  <span>
                    <Translate content="estimated time" />: {task.estimatedTime}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[--biqpod-text-secondary]">
                  <Icon icon={allIcons.solid.faListOl} />
                  <span>
                    {task.steps.length} <Translate content="steps" />
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <CircleTip
              icon={allIcons.solid.faTimes}
              onClick={() => {
                closePopup();
              }}
              className="text-[--biqpod-text-secondary]"
            />
          </div>
        </div>
      </div>
      <Line />
      {/* Content */}
      <Scroll className="max-h-[60vh]">
        <div className="p-6">
          {/* Prerequisites */}
          {task.prerequisites && task.prerequisites.length > 0 && (
            <div className="mb-6">
              <h3 className="flex items-center gap-2 mb-3 font-semibold text-lg">
                <div className="text-[--biqpod-primary]">
                  <Icon icon={allIcons.solid.faExclamationTriangle} />
                </div>
                <Translate content="prerequisites" />
              </h3>
              <div className="bg-[--biqpod-gray-opacity] p-3 border border-[--biqpod-borders] rounded-lg">
                <ul className="space-y-1 text-sm list-disc list-inside">
                  {task.prerequisites.map((prereq, index) => (
                    <li key={index} className="text-[--biqpod-text-secondary]">
                      <Translate content={prereq} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {/* Steps */}
          <h3 className="flex items-center gap-2 mb-4 font-semibold text-lg">
            <div className="text-[--biqpod-primary]">
              <Icon icon={allIcons.solid.faListOl} />
            </div>
            <Translate content="step-by-step guide" />
          </h3>
          <div className="space-y-4">
            {task.steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[--biqpod-gray-opacity] p-4 border border-[--biqpod-borders] rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-shrink-0 justify-center items-center bg-[--biqpod-primary] rounded-full w-8 h-8 font-semibold text-[--biqpod-primary-content] text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-2 font-semibold text-base">
                      <Translate content={step.title} />
                    </h4>
                    <p className="mb-2 text-sm leading-relaxed">
                      <Translate content={step.description} />
                    </p>
                    {step.tip && (
                      <div className="bg-[--biqpod-gray-opacity] mt-2 p-2 border border-[--biqpod-borders] rounded">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 text-[--biqpod-primary] text-xs">
                            <Icon icon={allIcons.solid.faLightbulb} />
                          </div>
                          <p className="text-[--biqpod-text-secondary] text-xs">
                            <Translate content={step.tip} />
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          {/* Related Features */}
          {task.relatedFeatures && task.relatedFeatures.length > 0 && (
            <div className="bg-[--biqpod-primary-background] mt-6 p-4 border border-[--biqpod-borders] border-solid rounded-lg">
              <h4 className="mb-2 font-semibold text-[--biqpod-text-color] capitalize">
                <Translate content="related features" />
              </h4>
              <div className="flex flex-wrap gap-2">
                {task.relatedFeatures.map((featureId) => {
                  const feature = features.find((f) => f.id === featureId);
                  return feature ? (
                    <Button
                      key={featureId}
                      className="bg-[--biqpod-primary] px-3 py-1 text-[--biqpod-primary-content] text-xs"
                      onClick={() => {
                        closePopup();
                        // Could add logic to navigate to feature details
                      }}
                    >
                      <Translate content={feature.name} />
                    </Button>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      </Scroll>
    </Card>
  );
});
